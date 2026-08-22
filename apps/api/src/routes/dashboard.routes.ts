import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { UserRole } from '@dayflow/shared';
import { prisma } from '../lib/prisma.js';

const router = Router();

// ─── GET /dashboard/metrics ───
// Authenticated: Admin/HR only
router.get(
  '/metrics',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.HR_OFFICER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // Total Employees
      const totalEmployees = await prisma.users.count({
        where: { company_id: companyId, status: 'ACTIVE' }
      });

      // Present Today (checked in today)
      const presentToday = await prisma.attendance_records.count({
        where: {
          user: { company_id: companyId },
          date: { gte: today, lt: tomorrow },
          status: { in: ['PRESENT', 'HALF_DAY'] }
        }
      });

      // On Leave
      const onLeave = await prisma.leave_requests.count({
        where: {
          user: { company_id: companyId },
          status: 'APPROVED',
          start_date: { lte: tomorrow },
          end_date: { gte: today }
        }
      });

      // Pending Approvals
      const pendingApprovals = await prisma.leave_requests.count({
        where: {
          user: { company_id: companyId },
          status: 'PENDING'
        }
      });

      res.json({
        success: true,
        data: {
          totalEmployees,
          presentToday,
          onLeave,
          pendingApprovals
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
