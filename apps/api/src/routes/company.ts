import { Router, type Request, type Response, type NextFunction } from 'express';
import { UserRole, type ApiResponse, type CompanySettingsDTO } from '@dayflow/shared';
import { authenticate, requireRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { BadRequestError } from '../lib/errors.js';

export const companyRouter = Router();

companyRouter.use(authenticate);

/**
 * GET /api/v1/company/settings
 *
 * Retrieve company settings (working days/week, break time, standard work hours, half-day threshold).
 * Viewable by all authenticated users.
 */
companyRouter.get(
  '/settings',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Fetch company record (default first company or user's company)
      const userCompanyId = req.user?.companyId;

      const company = userCompanyId
        ? await prisma.companies.findUnique({ where: { id: userCompanyId } })
        : await prisma.companies.findFirst();

      if (!company) {
        // Return default settings if company not bootstrapped yet
        const defaultSettings: CompanySettingsDTO & { id?: string; name?: string } = {
          workingDaysPerWeek: 5,
          breakTimeMinutes: 60,
          standardWorkHours: 8.0,
          halfDayThresholdHours: 4.0,
        };
        const response: ApiResponse<typeof defaultSettings> = {
          success: true,
          data: defaultSettings,
        };
        res.json(response);
        return;
      }

      const response: ApiResponse<{
        id: string;
        name: string;
        workingDaysPerWeek: number;
        breakTimeMinutes: number;
        standardWorkHours: number;
        halfDayThresholdHours: number;
      }> = {
        success: true,
        data: {
          id: company.id,
          name: company.name,
          workingDaysPerWeek: company.working_days_per_week,
          breakTimeMinutes: company.break_time_minutes,
          standardWorkHours: Number(company.standard_work_hours),
          halfDayThresholdHours: Number(company.half_day_threshold_hours),
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/company/settings
 *
 * FR-36: Update company settings.
 * Editable by ADMIN only.
 */
companyRouter.patch(
  '/settings',
  requireRole(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        workingDaysPerWeek,
        breakTimeMinutes,
        standardWorkHours,
        halfDayThresholdHours,
      } = req.body as Partial<CompanySettingsDTO>;

      if (
        workingDaysPerWeek !== undefined &&
        (workingDaysPerWeek < 1 || workingDaysPerWeek > 7)
      ) {
        throw new BadRequestError('Working days per week must be between 1 and 7');
      }

      if (breakTimeMinutes !== undefined && breakTimeMinutes < 0) {
        throw new BadRequestError('Break time minutes cannot be negative');
      }

      if (standardWorkHours !== undefined && standardWorkHours <= 0) {
        throw new BadRequestError('Standard work hours must be positive');
      }

      if (halfDayThresholdHours !== undefined && halfDayThresholdHours <= 0) {
        throw new BadRequestError('Half day threshold hours must be positive');
      }

      const userCompanyId = req.user?.companyId;

      let company = userCompanyId
        ? await prisma.companies.findUnique({ where: { id: userCompanyId } })
        : await prisma.companies.findFirst();

      if (!company) {
        // Create bootstrap company record if none exists
        company = await prisma.companies.create({
          data: {
            name: 'Dayflow Inc.',
            login_prefix: 'OI',
            working_days_per_week: workingDaysPerWeek ?? 5,
            break_time_minutes: breakTimeMinutes ?? 60,
            standard_work_hours: standardWorkHours ?? 8.0,
            half_day_threshold_hours: halfDayThresholdHours ?? 4.0,
          },
        });
      } else {
        company = await prisma.companies.update({
          where: { id: company.id },
          data: {
            working_days_per_week: workingDaysPerWeek ?? company.working_days_per_week,
            break_time_minutes: breakTimeMinutes ?? company.break_time_minutes,
            standard_work_hours: standardWorkHours ?? company.standard_work_hours,
            half_day_threshold_hours: halfDayThresholdHours ?? company.half_day_threshold_hours,
            updated_at: new Date(),
          },
        });
      }

      const response: ApiResponse<{
        id: string;
        name: string;
        workingDaysPerWeek: number;
        breakTimeMinutes: number;
        standardWorkHours: number;
        halfDayThresholdHours: number;
      }> = {
        success: true,
        data: {
          id: company.id,
          name: company.name,
          workingDaysPerWeek: company.working_days_per_week,
          breakTimeMinutes: company.break_time_minutes,
          standardWorkHours: Number(company.standard_work_hours),
          halfDayThresholdHours: Number(company.half_day_threshold_hours),
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);
