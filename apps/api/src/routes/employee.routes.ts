import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import type { ApiResponse, CreateEmployeeResponse } from '@dayflow/shared';
import { UserRole } from '@dayflow/shared';
import { validateBody } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { generateLoginId, generateEmpCode } from '../services/loginId.service.js';
import { generateSecurePassword, hashPassword } from '../services/password.service.js';

// ─── Create Employee Zod Schema (FR-3, FR-4) ───
// Explicit field whitelist — only these fields are accepted (Security Checklist #15).
const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Valid work email is required'),
  phone: z.string().min(7).max(20).optional(),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid role' }) }),
  department: z.string().max(100).optional(),
  jobPosition: z.string().max(100).optional(),
  managerId: z.string().uuid('Invalid manager ID').optional(),
  location: z.string().max(150).optional(),
  dateOfJoining: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Valid date is required (YYYY-MM-DD)' },
  ),
});

const router = Router();

// ─── POST /employees ───
// Authenticated: Admin/HR only. Creates a new employee with auto-generated
// Login ID (FR-3) and system-generated password (FR-4).
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.HR_OFFICER),
  validateBody(createEmployeeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as z.infer<typeof createEmployeeSchema>;
      const creatorCompanyId = req.user!.companyId;

      // Generate secure password — shown to the admin ONCE, never logged (Security Checklist #9)
      const plainPassword = generateSecurePassword();
      const passwordHash = await hashPassword(plainPassword);

      const joiningDate = new Date(body.dateOfJoining);
      const joiningYear = joiningDate.getFullYear();

      // All inside a transaction for Login ID sequence safety (FR-3)
      const user = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
        // Get company for login prefix
        const company = await tx.companies.findUnique({
          where: { id: creatorCompanyId },
          select: { login_prefix: true },
        });

        if (!company) {
          throw new Error('Company not found');
        }

        const loginId = await generateLoginId(
          tx,
          creatorCompanyId,
          company.login_prefix,
          body.firstName,
          body.lastName,
          joiningYear,
        );

        const empCode = await generateEmpCode(tx, creatorCompanyId);

        return tx.users.create({
          data: {
            company_id: creatorCompanyId,
            login_id: loginId,
            emp_code: empCode,
            email: body.email.toLowerCase(),
            password_hash: passwordHash,
            must_change_password: true, // FR-4: force password change on first login
            role: body.role,
            status: 'ACTIVE',
            first_name: body.firstName,
            last_name: body.lastName,
            phone: body.phone ?? null,
            department: body.department ?? null,
            job_position: body.jobPosition ?? null,
            manager_id: body.managerId ?? null,
            location: body.location ?? null,
            date_of_joining: joiningDate,
            email_verified: true, // Employee accounts skip email verification (SRS §3)
          },
          select: {
            id: true,
            login_id: true,
            emp_code: true,
            email: true,
            first_name: true,
            last_name: true,
            role: true,
          },
        });
      });

      const responseData: CreateEmployeeResponse = {
        user: {
          id: user.id,
          loginId: user.login_id,
          empCode: user.emp_code,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role as UserRole,
        },
        generatedPassword: plainPassword, // Shown ONCE — never stored or logged
      };

      const response: ApiResponse<CreateEmployeeResponse> = {
        success: true,
        data: responseData,
      };

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
