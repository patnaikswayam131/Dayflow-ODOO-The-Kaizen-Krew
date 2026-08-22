import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { UserRole } from '@dayflow/shared';

const router = Router();

// ─── GET /leave ───
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isAdminOrHR = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.HR_OFFICER;

      const whereClause: any = {};
      if (!isAdminOrHR) {
        whereClause.user_id = req.user!.id;
      } else {
        whereClause.user = { company_id: req.user!.companyId };
      }

      const requests = await prisma.leave_requests.findMany({
        where: whereClause,
        include: {
          user: { select: { first_name: true, last_name: true, emp_code: true } },
          leave_type: { select: { name: true } }
        },
        orderBy: { created_at: 'desc' }
      });

      res.json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /leave ───
router.post(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, startDate, endDate, remarks, days } = req.body;

      // Find or create the leave type string (the frontend sends a string, our DB uses a table)
      let leaveType = await prisma.leave_types.findFirst({
        where: { name: type, company_id: req.user!.companyId }
      });

      if (!leaveType) {
        leaveType = await prisma.leave_types.create({
          data: {
            name: type,
            company_id: req.user!.companyId
          }
        });
      }

      const request = await prisma.leave_requests.create({
        data: {
          user_id: req.user!.id,
          leave_type_id: leaveType.id,
          start_date: new Date(startDate),
          end_date: new Date(endDate),
          days_requested: Number(days),
          remarks: remarks || null,
          status: 'PENDING'
        },
        include: {
          leave_type: { select: { name: true } },
          user: { select: { first_name: true, last_name: true } }
        }
      });

      res.status(201).json({ success: true, data: request });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /leave/:id/status ───
router.patch(
  '/:id/status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.HR_OFFICER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      const { id } = req.params;

      const request = await prisma.leave_requests.update({
        where: { id },
        data: { 
          status,
          reviewed_by: req.user!.id,
          reviewed_at: new Date()
        },
        include: {
          leave_type: { select: { name: true } },
          user: { select: { first_name: true, last_name: true } }
        }
      });

      res.json({ success: true, data: request });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
