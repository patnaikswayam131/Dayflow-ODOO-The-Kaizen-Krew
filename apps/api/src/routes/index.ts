import { Router } from 'express';
import type { ApiResponse } from '@dayflow/shared';

// ─── Route Modules ───
import authRoutes from './auth.routes.js';
import employeeRoutes from './employee.routes.js';
import attendanceRoutes from './attendance.routes.js';
import leaveRoutes from './leave.routes.js';
import dashboardRoutes from './dashboard.routes.js';

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

// ── Employee routes ──
router.use('/employees', employeeRoutes);

// ── Attendance routes ──
router.use('/attendance', attendanceRoutes);

// ── Leave routes ──
router.use('/leave', leaveRoutes);

// ── Dashboard routes ──
router.use('/dashboard', dashboardRoutes);

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
