import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { TokenPayload, UserRole } from '@dayflow/shared';
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';

// Extend Express Request to carry authenticated user info
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * JWT authentication middleware (Security Checklist #10).
 *
 * Reads the access token from an httpOnly cookie named 'access_token'.
 * Verifies the token and attaches the decoded payload to req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.access_token as string | undefined;

  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    // This is a server config error, not a client error
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    req.user = decoded;
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/**
 * Role-based access control middleware (Security Checklist #4).
 *
 * Re-checks role server-side on every request — UI hiding a button is never sufficient.
 * Usage: router.get('/admin-only', authenticate, requireRole('ADMIN'), handler)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      throw new ForbiddenError('You do not have permission to access this resource');
    }

    next();
  };
}

/**
 * Resource ownership OR role check (Security Checklist #3).
 *
 * Allows access if the user owns the resource (userId matches) OR has one of the allowed roles.
 * The resourceUserIdExtractor function extracts the resource owner's user ID from the request.
 *
 * Usage: router.get('/profile/:id', authenticate, requireOwnerOrRole(
 *   (req) => req.params.id, 'ADMIN', 'HR_OFFICER'
 * ), handler)
 */
export function requireOwnerOrRole(
  resourceUserIdExtractor: (req: Request) => string,
  ...allowedRoles: UserRole[]
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const resourceUserId = resourceUserIdExtractor(req);
    const isOwner = req.user.userId === resourceUserId;
    const hasRole = allowedRoles.includes(req.user.role as UserRole);

    if (!isOwner && !hasRole) {
      throw new ForbiddenError('You do not have permission to access this resource');
    }

    next();
  };
}

/**
 * Convenience version of requireOwnerOrRole that extracts the user ID
 * from req.params[paramName] automatically.
 *
 * Usage: router.get('/employees/:userId/attendance',
 *   authenticate,
 *   requireSelfOrRole('userId', [UserRole.ADMIN, UserRole.HR_OFFICER]),
 *   handler
 * )
 */
export function requireSelfOrRole(paramName: string, allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const resourceUserId = req.params[paramName];
    const isOwner = req.user.userId === resourceUserId;
    const hasRole = allowedRoles.includes(req.user.role as UserRole);

    if (!isOwner && !hasRole) {
      throw new ForbiddenError('You do not have permission to access this resource');
    }

    next();
  };
}

