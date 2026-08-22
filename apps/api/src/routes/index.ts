import { Router } from 'express';
import type { ApiResponse } from '@dayflow/shared';

// ─── Route Modules ───
// Each developer implements their routes in their feature branch.
// The skeleton routers below ensure the app compiles and routes exist
// before feature code is written.

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

// ── Auth routes (Dev 1: feat/auth-foundation) ──
const authRouter = Router();
authRouter.post('/login', (_req, res) => {
  res.status(501).json({
    success: false,
    error: { message: 'Not implemented — see feat/auth-foundation', code: 'NOT_IMPLEMENTED' },
  } satisfies ApiResponse);
});
authRouter.post('/bootstrap', (_req, res) => {
  res.status(501).json({
    success: false,
    error: { message: 'Not implemented — see feat/auth-foundation', code: 'NOT_IMPLEMENTED' },
  } satisfies ApiResponse);
});
authRouter.post('/logout', (_req, res) => {
  res.status(501).json({
    success: false,
    error: { message: 'Not implemented — see feat/auth-foundation', code: 'NOT_IMPLEMENTED' },
  } satisfies ApiResponse);
});
authRouter.post('/refresh', (_req, res) => {
  res.status(501).json({
    success: false,
    error: { message: 'Not implemented — see feat/auth-foundation', code: 'NOT_IMPLEMENTED' },
  } satisfies ApiResponse);
});
router.use('/auth', authRouter);

// ── Employee routes (Dev 2: feat/employee-profile) ──
const employeeRouter = Router();
employeeRouter.get('/', (_req, res) => {
  res.status(501).json({
    success: false,
    error: { message: 'Not implemented — see feat/employee-profile', code: 'NOT_IMPLEMENTED' },
  } satisfies ApiResponse);
});
router.use('/employees', employeeRouter);

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
