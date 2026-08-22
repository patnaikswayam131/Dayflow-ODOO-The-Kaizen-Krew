import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  calculateSalaryStructure,
  calculatePayableDays,
  UserRole,
  type ApiResponse,
  type UpsertSalaryStructureDTO,
  type PayableDaysResult,
} from '@dayflow/shared';
import { authenticate, requireRole, requireOwnerOrRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';

export const salaryRouter = Router();

salaryRouter.use(authenticate);

/**
 * GET /api/v1/salary/users/:userId
 *
 * Visibility rules per SRS §3 resolution 3:
 * - Employee may view their OWN Salary Info tab (read-only)
 * - Admin can view any employee's Salary Info
 * - HR Officer can view any employee's Salary Info
 *
 * Enforced via requireOwnerOrRole((req) => typeof req.params.userId === 'string' ? req.params.userId : '', 'ADMIN', 'HR_OFFICER')
 */
salaryRouter.get(
  '/users/:userId',
  requireOwnerOrRole(
    (req: Request): string => (typeof req.params.userId === 'string' ? req.params.userId : ''),
    UserRole.ADMIN,
    UserRole.HR_OFFICER
  ),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const targetUserId: string = typeof userId === 'string' ? userId : '';

      const userExists = await prisma.users.findUnique({
        where: { id: targetUserId },
      });

      if (!userExists) {
        throw new NotFoundError('Employee not found');
      }

      // Find active or latest salary structure for user
      const existingStructure = await prisma.salary_structures.findFirst({
        where: { user_id: targetUserId },
        orderBy: { effective_from: 'desc' },
        include: {
          salary_components: true,
        },
      });

      if (!existingStructure) {
        // If no stored structure exists, generate standard computed structure with default ₹50,000 wage
        const calculated = calculateSalaryStructure(50000);
        const response: ApiResponse<{
          monthlyWage: number;
          yearlyWage: number;
          wageType: string;
          effectiveFrom: string;
          isDefault: boolean;
          calculation: typeof calculated;
        }> = {
          success: true,
          data: {
            monthlyWage: 50000,
            yearlyWage: 600000,
            wageType: 'FIXED',
            effectiveFrom: new Date().toISOString().slice(0, 10),
            isDefault: true,
            calculation: calculated,
          },
        };
        res.json(response);
        return;
      }

      const monthlyWage = Number(existingStructure.monthly_wage);

      // Re-run pure calculation engine to guarantee consistent residual and percentages
      const dbComponentInputs = existingStructure.salary_components.map((c: any) => ({
        componentKey: c.component_key,
        computationType: c.computation_type,
        percentageBase: c.percentage_base,
        configuredValue: Number(c.configured_value),
      }));

      const calculation = calculateSalaryStructure(monthlyWage, dbComponentInputs);

      const response: ApiResponse<{
        id: string;
        userId: string;
        monthlyWage: number;
        yearlyWage: number;
        wageType: string;
        effectiveFrom: string;
        isDefault: boolean;
        calculation: typeof calculation;
      }> = {
        success: true,
        data: {
          id: existingStructure.id,
          userId: existingStructure.user_id,
          monthlyWage,
          yearlyWage: calculation.yearlyWage,
          wageType: existingStructure.wage_type,
          effectiveFrom: existingStructure.effective_from.toISOString().slice(0, 10),
          isDefault: false,
          calculation,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/v1/salary/users/:userId
 *
 * Permission rules per SRS §3 resolution 3:
 * - Admin ONLY can view and EDIT another employee's Salary Info.
 * - HR Officer can view but NOT EDIT another employee's Salary Info (returns 403 Forbidden).
 * - Employee cannot edit any Salary Info (returns 403 Forbidden).
 *
 * Enforced explicitly server-side using requireRole('ADMIN').
 */
salaryRouter.put(
  '/users/:userId',
  requireRole(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const targetUserId: string = typeof userId === 'string' ? userId : '';
      const body = req.body as UpsertSalaryStructureDTO;

      if (!body.monthlyWage || body.monthlyWage <= 0) {
        throw new BadRequestError('Monthly wage must be a positive number');
      }

      const userExists = await prisma.users.findUnique({
        where: { id: targetUserId },
      });

      if (!userExists) {
        throw new NotFoundError('Employee not found');
      }

      // Calculate component amounts using pure calculation engine (FR-32 to FR-35)
      const calculation = calculateSalaryStructure(body.monthlyWage, body.components);

      const effectiveFrom = body.effectiveFrom
        ? new Date(body.effectiveFrom)
        : new Date();

      // Upsert in database transaction
      const updatedStructure = await prisma.$transaction(async (tx: any) => {
        // Delete old structure for user or update existing
        await tx.salary_structures.deleteMany({
          where: { user_id: targetUserId },
        });

        const createdStructure = await tx.salary_structures.create({
          data: {
            user_id: targetUserId,
            monthly_wage: body.monthlyWage,
            wage_type: 'FIXED',
            effective_from: effectiveFrom,
          },
        });

        const componentData = calculation.components.map((comp) => ({
          salary_structure_id: createdStructure.id,
          component_key: comp.componentKey,
          computation_type: comp.computationType,
          percentage_base: comp.percentageBase ?? undefined,
          configured_value: comp.configuredValue,
          computed_amount: comp.computedAmount,
        }));

        await tx.salary_components.createMany({
          data: componentData,
        });

        // Audit log entry
        await tx.audit_logs.create({
          data: {
            actor_user_id: req.user?.userId,
            action: 'SALARY_UPDATED',
            entity: 'salary_structures',
            entity_id: createdStructure.id,
            metadata: {
              target_user_id: targetUserId,
              monthly_wage: body.monthlyWage,
              yearly_wage: calculation.yearlyWage,
            },
          },
        });

        return createdStructure;
      });

      const response: ApiResponse<{
        id: string;
        userId: string;
        monthlyWage: number;
        yearlyWage: number;
        wageType: string;
        effectiveFrom: string;
        calculation: typeof calculation;
      }> = {
        success: true,
        data: {
          id: updatedStructure.id,
          userId: updatedStructure.user_id,
          monthlyWage: body.monthlyWage,
          yearlyWage: calculation.yearlyWage,
          wageType: updatedStructure.wage_type,
          effectiveFrom: updatedStructure.effective_from.toISOString().slice(0, 10),
          calculation,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/salary/payable-days/:userId
 *
 * FR-37: Pure payable days engine integration.
 */
salaryRouter.get(
  '/payable-days/:userId',
  requireOwnerOrRole(
    (req: Request): string => (typeof req.params.userId === 'string' ? req.params.userId : ''),
    UserRole.ADMIN,
    UserRole.HR_OFFICER
  ),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const totalWorkingDays = req.query.totalWorkingDays
        ? parseInt(req.query.totalWorkingDays as string, 10)
        : 22;
      const unpaidLeaveDays = req.query.unpaidLeaveDays
        ? parseFloat(req.query.unpaidLeaveDays as string)
        : 0;
      const absentDays = req.query.absentDays
        ? parseFloat(req.query.absentDays as string)
        : 0;

      const result: PayableDaysResult = calculatePayableDays({
        totalWorkingDays,
        unpaidLeaveDays,
        absentDays,
      });

      const response: ApiResponse<PayableDaysResult> = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);
