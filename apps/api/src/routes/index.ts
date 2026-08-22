import { Router } from 'express';
import type { ApiResponse } from '@dayflow/shared';

// ─── Route Modules ───
import authRoutes from './auth.routes.js';
import employeeRoutes from './employee.routes.js';

const router = Router();

// ── Health check (always available, no auth) ──
router.get('/health', (_req, res) => {
  const response: ApiResponse<{ status: string; timestamp: string }> = {
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  };
  res.json(response);
});

// ── Auth routes (Dev 1: feat/auth-foundation) — IMPLEMENTED ──
router.use('/auth', authRoutes);

// ── Employee routes (Dev 1: POST /employees; Dev 2 will add GET/PUT profile routes) ──
router.use('/employees', employeeRoutes);

// ── Attendance routes (Dev 3: feat/attendance-leave) ──
const attendanceRouter = Router();
attendanceRouter.get('/', (_req, res) => {
  res.status(501).json({
    success: false,
    error: { message: 'Not implemented — see feat/attendance-leave', code: 'NOT_IMPLEMENTED' },
  } satisfies ApiResponse);
});
router.use('/attendance', attendanceRouter);

// ── Leave routes (Dev 3: feat/attendance-leave) ──
const leaveRouter = Router();
leaveRouter.get('/', (_req, res) => {
  res.status(501).json({
    success: false,
    error: { message: 'Not implemented — see feat/attendance-leave', code: 'NOT_IMPLEMENTED' },
  } satisfies ApiResponse);
});
router.use('/leave', leaveRouter);

// ── Salary routes (Dev 4: feat/salary-shell) ──
const salaryRouter = Router();
salaryRouter.get('/', (_req, res) => {
  res.status(501).json({
    success: false,
    error: { message: 'Not implemented — see feat/salary-shell', code: 'NOT_IMPLEMENTED' },
  } satisfies ApiResponse);
});
router.use('/salary', salaryRouter);

export default router;
