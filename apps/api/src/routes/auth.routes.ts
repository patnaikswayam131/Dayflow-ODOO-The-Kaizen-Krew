import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse, AuthUser } from '@dayflow/shared';
import { companyBootstrapSchema, loginSchema, changePasswordSchema } from '@dayflow/shared';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as authService from '../services/auth.service.js';

const router = Router();

// ─── GET /auth/bootstrap/status ───
// Public: check if system has been bootstrapped (FR-1).
// Used by frontend to show/hide the bootstrap signup form.
router.get(
  '/bootstrap/status',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await authService.getBootstrapStatus();
      const response: ApiResponse<typeof status> = {
        success: true,
        data: status,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /auth/bootstrap ───
// Public: one-time company + admin bootstrap (FR-1).
// Becomes unusable after the first company is created.
router.post(
  '/bootstrap',
  validateBody(companyBootstrapSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.bootstrapCompany(req.body);
      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /auth/verify-email ───
// Public: verify email using the token from query string (FR-1).
router.post(
  '/verify-email',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        res.status(400).json({
          success: false,
          error: { message: 'Verification token is required', code: 'BAD_REQUEST' },
        } satisfies ApiResponse);
        return;
      }
      await authService.verifyEmail(token);
      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Email verified successfully. You can now log in.' },
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /auth/login ───
// Public: sign in with Login ID or Email + Password (FR-2).
// Generic error message on any failure — never reveals which field was wrong.
router.post(
  '/login',
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.login(req.body, res);
      const response: ApiResponse<{ user: AuthUser }> = {
        success: true,
        data: { user },
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /auth/refresh ───
// Refresh token rotation — uses refresh_token cookie, not access_token (FR-5).
router.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.refreshSession(req, res);
      const response: ApiResponse<{ user: AuthUser }> = {
        success: true,
        data: { user },
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /auth/logout ───
// Authenticated: revoke refresh token, clear cookies.
router.post(
  '/logout',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.logout(req, res);
      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Logged out successfully' },
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /auth/me ───
// Authenticated: return current user info.
router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getCurrentUser(req.user!.userId);
      const response: ApiResponse<{ user: AuthUser }> = {
        success: true,
        data: { user },
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /auth/change-password ───
// Authenticated: change password (FR-17, Security Checklist #19).
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.changePassword(req.user!.userId, req.body, res);
      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Password changed successfully. Please log in again.' },
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
