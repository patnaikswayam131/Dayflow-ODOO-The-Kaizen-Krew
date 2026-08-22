import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { UserRole, ComputationType, PercentageBase, UpsertSalaryStructureDTO } from '@dayflow/shared';

const router = Router();

// GET /salary/:userId
// Admin/HR or Self can view
router.get(
  '/:userId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;
      const isAdminOrHR = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.HR_OFFICER;
      
      if (!isAdminOrHR && req.user!.userId !== userId) {
        return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
      }

      const structure = await prisma.salary_structures.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        include: { salary_components: true }
      });

      res.json({ success: true, data: structure });
    } catch (err) {
      next(err);
    }
  }
);

// POST /salary/:userId
// Admin/HR only
router.post(
  '/:userId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.HR_OFFICER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;
      const body = req.body as UpsertSalaryStructureDTO;

      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });

      let basicAmount = 0;
      
      // Calculate basic first if any component depends on it
      const basicComp = body.components.find(c => c.componentKey === 'BASIC');
      if (basicComp) {
        if (basicComp.computationType === ComputationType.PERCENTAGE) {
          basicAmount = (body.monthlyWage * basicComp.configuredValue) / 100;
        } else {
          basicAmount = basicComp.configuredValue;
        }
      }

      const structure = await prisma.$transaction(async (tx) => {
        const struct = await tx.salary_structures.create({
          data: {
            user_id: userId,
            monthly_wage: body.monthlyWage,
            wage_type: 'FIXED',
            effective_from: body.effectiveFrom ? new Date(body.effectiveFrom) : new Date()
          }
        });

        const componentsData = body.components.map(comp => {
          let computedAmount = 0;
          if (comp.computationType === ComputationType.FIXED_AMOUNT) {
            computedAmount = comp.configuredValue;
          } else if (comp.computationType === ComputationType.PERCENTAGE) {
            const base = comp.percentageBase === PercentageBase.BASIC ? basicAmount : body.monthlyWage;
            computedAmount = (base * comp.configuredValue) / 100;
          }

          return {
            salary_structure_id: struct.id,
            component_key: comp.componentKey,
            computation_type: comp.computationType,
            percentage_base: comp.percentageBase || null,
            configured_value: comp.configuredValue,
            computed_amount: computedAmount
          };
        });

        if (componentsData.length > 0) {
          await tx.salary_components.createMany({ data: componentsData });
        }

        return tx.salary_structures.findUnique({
          where: { id: struct.id },
          include: { salary_components: true }
        });
      });

      res.status(201).json({ success: true, data: structure });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
