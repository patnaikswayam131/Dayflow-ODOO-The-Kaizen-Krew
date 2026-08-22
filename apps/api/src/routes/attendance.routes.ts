import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { UserRole } from '@dayflow/shared';

const router = Router();

// ─── GET /attendance/today ───
// Authenticated: All. Gets the logged-in user's attendance for today.
router.get(
  '/today',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const record = await prisma.attendance_records.findFirst({
        where: {
          user_id: req.user!.id,
          date: today
        }
      });

      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /attendance/check-in ───
router.post(
  '/check-in',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const now = new Date();

      let record = await prisma.attendance_records.findFirst({
        where: { user_id: req.user!.id, date: today }
      });

      if (record && record.check_in_at) {
        return res.status(400).json({ success: false, error: { message: 'Already checked in today' } });
      }

      if (record) {
        record = await prisma.attendance_records.update({
          where: { id: record.id },
          data: { check_in_at: now, status: 'PRESENT' }
        });
      } else {
        record = await prisma.attendance_records.create({
          data: {
            user_id: req.user!.id,
            date: today,
            check_in_at: now,
            status: 'PRESENT'
          }
        });
      }

      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /attendance/check-out ───
router.post(
  '/check-out',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const now = new Date();

      let record = await prisma.attendance_records.findFirst({
        where: { user_id: req.user!.id, date: today }
      });

      if (!record || !record.check_in_at) {
        return res.status(400).json({ success: false, error: { message: 'Not checked in' } });
      }

      const checkInTime = new Date(record.check_in_at).getTime();
      const checkOutTime = now.getTime();
      const workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

      record = await prisma.attendance_records.update({
        where: { id: record.id },
        data: { 
          check_out_at: now,
          work_hours: workHours,
        }
      });

      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /attendance ───
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isAdminOrHR = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.HR_OFFICER;
      const dateFilter = req.query.date as string;

      const whereClause: any = {};
      if (!isAdminOrHR) {
        whereClause.user_id = req.user!.id;
      } else {
        whereClause.user = { company_id: req.user!.companyId };
      }

      if (dateFilter) {
        const d = new Date(dateFilter);
        d.setHours(0, 0, 0, 0);
        whereClause.date = d;
      }

      const records = await prisma.attendance_records.findMany({
        where: whereClause,
        include: {
          user: { select: { first_name: true, last_name: true, emp_code: true } }
        },
        orderBy: { date: 'desc' }
      });

      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
