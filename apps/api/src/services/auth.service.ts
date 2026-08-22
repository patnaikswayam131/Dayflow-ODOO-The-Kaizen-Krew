import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword } from './password.service.js';
import { generateLoginId, generateEmpCode } from './loginId.service.js';
import type {
  CompanyBootstrapDTO,
  LoginDTO,
  ChangePasswordDTO,
  TokenPayload,
  AuthUser,
} from '@dayflow/shared';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../lib/errors.js';

// ─── Cookie Configuration (Security Checklist #10) ───
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

// ─── JWT Helpers ───

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET is not configured');
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not configured');
  return secret;
}

function signAccessToken(payload: TokenPayload): string {
  const expiry = process.env.JWT_ACCESS_EXPIRY || '15m';
  return jwt.sign(payload as object, getAccessSecret(), { expiresIn: expiry as unknown as number });
}

function signRefreshToken(payload: { userId: string }): string {
  const expiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: expiry as unknown as number });
}

function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
  const value = parseInt(match[1]!, 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

function setTokenCookies(res: Response, accessToken: string, refreshToken: string): void {
  const accessExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
  const refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: parseExpiryToMs(accessExpiry),
  });

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: parseExpiryToMs(refreshExpiry),
    path: '/api/v1/auth', // Refresh cookie only sent to auth endpoints
  });
}

function clearTokenCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...COOKIE_OPTIONS });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...COOKIE_OPTIONS, path: '/api/v1/auth' });
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Build AuthUser response shape ───

function buildAuthUser(
  user: {
    id: string;
    login_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    avatar_url: string | null;
    must_change_password: boolean;
    company_id: string;
    company: { name: string; logo_url: string | null };
  },
): AuthUser {
  return {
    id: user.id,
    loginId: user.login_id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    avatarUrl: user.avatar_url,
    mustChangePassword: user.must_change_password,
    companyId: user.company_id,
    companyName: user.company.name,
    companyLogoUrl: user.company.logo_url,
  };
}

// ═══════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Check if the system has already been bootstrapped (FR-1).
 */
export async function getBootstrapStatus(): Promise<{ isBootstrapped: boolean }> {
  const count = await prisma.companies.count();
  return { isBootstrapped: count > 0 };
}

/**
 * One-time company + admin bootstrap (FR-1).
 *
 * Creates the company, the first admin user, and seeds default leave types.
 * This endpoint becomes unusable after the first company is created.
 */
export async function bootstrapCompany(dto: CompanyBootstrapDTO): Promise<{
  user: AuthUser;
  verificationMessage: string;
}> {
  // Gate: only one company allowed
  const existing = await prisma.companies.count();
  if (existing > 0) {
    throw new ConflictError('System has already been bootstrapped. Only one company is allowed.');
  }

  const passwordHash = await hashPassword(dto.password);
  const now = new Date();
  const joiningYear = now.getFullYear();

  const result = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
    // 1. Create company
    const company = await tx.companies.create({
      data: {
        name: dto.companyName,
        login_prefix: dto.loginPrefix.toUpperCase(),
        // logo_url will be set via a separate upload endpoint
      },
    });

    // 2. Generate Login ID and emp_code for the admin
    const loginId = await generateLoginId(
      tx,
      company.id,
      company.login_prefix,
      dto.adminFirstName,
      dto.adminLastName,
      joiningYear,
    );
    const empCode = await generateEmpCode(tx, company.id);

    // 3. Create admin user
    const user = await tx.users.create({
      data: {
        company_id: company.id,
        login_id: loginId,
        emp_code: empCode,
        email: dto.adminEmail.toLowerCase(),
        password_hash: passwordHash,
        must_change_password: false, // Admin chose their own password
        role: 'ADMIN',
        status: 'ACTIVE',
        first_name: dto.adminFirstName,
        last_name: dto.adminLastName,
        phone: dto.adminPhone ?? null,
        date_of_joining: now,
        email_verified: false, // Requires verification before login
      },
    });

    // 4. Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(verificationToken);
    await tx.email_verification_tokens.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    // 5. Seed default leave types for the company
    await tx.leave_types.createMany({
      data: [
        {
          company_id: company.id,
          name: 'Paid Time Off',
          is_paid: true,
          requires_attachment: false,
          default_allocation_days: 24,
        },
        {
          company_id: company.id,
          name: 'Sick Leave',
          is_paid: true,
          requires_attachment: true,
          default_allocation_days: 7,
        },
        {
          company_id: company.id,
          name: 'Unpaid Leave',
          is_paid: false,
          requires_attachment: false,
          default_allocation_days: 0,
        },
      ],
    });

    // In development, log the verification token to console (no real email provider)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n[DEV] Email verification token for ${user.email}: ${verificationToken}`);
      console.log(`[DEV] Verify at: POST /api/v1/auth/verify-email?token=${verificationToken}\n`);
    }

    return {
      user: {
        ...user,
        company: { name: company.name, logo_url: company.logo_url },
      },
      verificationToken,
    };
  });

  return {
    user: buildAuthUser(result.user),
    verificationMessage:
      process.env.NODE_ENV === 'production'
        ? 'A verification email has been sent. Please verify your email before logging in.'
        : `Development mode: Check server console for verification token.`,
  };
}

/**
 * Verify email using the token (FR-1).
 */
export async function verifyEmail(token: string): Promise<void> {
  const tokenHash = hashToken(token);

  const verification = await prisma.email_verification_tokens.findFirst({
    where: {
      token_hash: tokenHash,
      expires_at: { gt: new Date() },
      used: false,
    },
  });

  if (!verification) {
    throw new BadRequestError('Invalid or expired verification token');
  }

  await prisma.$transaction([
    prisma.users.update({
      where: { id: verification.user_id },
      data: { email_verified: true },
    }),
    prisma.email_verification_tokens.update({
      where: { id: verification.id },
      data: { used: true },
    }),
  ]);
}

/**
 * Sign in with Login ID or Email + Password (FR-2, FR-5).
 *
 * Generic error on any failure — never reveals which field was wrong.
 */
export async function login(
  dto: LoginDTO,
  res: Response,
): Promise<AuthUser> {
  const genericError = new UnauthorizedError('Invalid credentials');

  // Look up user by login_id OR email (case-insensitive)
  const user = await prisma.users.findFirst({
    where: {
      OR: [
        { login_id: dto.identifier },
        { email: dto.identifier.toLowerCase() },
      ],
    },
    include: {
      company: {
        select: { name: true, logo_url: true },
      },
    },
  });

  if (!user) throw genericError;
  if (user.status !== 'ACTIVE') throw genericError;

  // Check email verification (only for the bootstrap admin — employees skip this)
  if (!user.email_verified) {
    throw genericError;
  }

  // Verify password
  const valid = await comparePassword(dto.password, user.password_hash);
  if (!valid) throw genericError;

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    companyId: user.company_id,
    role: user.role,
    loginId: user.login_id,
  };

  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken({ userId: user.id });

  // Store refresh token hash
  const refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  await prisma.refresh_tokens.create({
    data: {
      user_id: user.id,
      token_hash: hashToken(refreshToken),
      expires_at: new Date(Date.now() + parseExpiryToMs(refreshExpiry)),
    },
  });

  // Set httpOnly cookies
  setTokenCookies(res, accessToken, refreshToken);

  return buildAuthUser(user);
}

/**
 * Refresh token rotation (FR-5).
 */
export async function refreshSession(
  req: Request,
  res: Response,
): Promise<AuthUser> {
  const oldToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
  if (!oldToken) {
    throw new UnauthorizedError('Refresh token required');
  }

  // Verify JWT signature
  let decoded: { userId: string };
  try {
    decoded = jwt.verify(oldToken, getRefreshSecret()) as { userId: string };
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Look up the token hash in DB
  const oldTokenHash = hashToken(oldToken);
  const storedToken = await prisma.refresh_tokens.findFirst({
    where: {
      token_hash: oldTokenHash,
      user_id: decoded.userId,
      revoked: false,
      expires_at: { gt: new Date() },
    },
  });

  if (!storedToken) {
    // Possible token reuse attack — revoke all tokens for this user
    await prisma.refresh_tokens.updateMany({
      where: { user_id: decoded.userId },
      data: { revoked: true },
    });
    clearTokenCookies(res);
    throw new UnauthorizedError('Invalid refresh token — all sessions revoked for security');
  }

  // Fetch user
  const user = await prisma.users.findUnique({
    where: { id: decoded.userId },
    include: {
      company: { select: { name: true, logo_url: true } },
    },
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Account is inactive');
  }

  // Rotate: revoke old, issue new
  const newAccessPayload: TokenPayload = {
    userId: user.id,
    companyId: user.company_id,
    role: user.role,
    loginId: user.login_id,
  };

  const newAccessToken = signAccessToken(newAccessPayload);
  const newRefreshToken = signRefreshToken({ userId: user.id });

  const refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  await prisma.$transaction([
    prisma.refresh_tokens.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    }),
    prisma.refresh_tokens.create({
      data: {
        user_id: user.id,
        token_hash: hashToken(newRefreshToken),
        expires_at: new Date(Date.now() + parseExpiryToMs(refreshExpiry)),
      },
    }),
  ]);

  setTokenCookies(res, newAccessToken, newRefreshToken);

  return buildAuthUser(user);
}

/**
 * Logout — revoke refresh token and clear cookies.
 */
export async function logout(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;

  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.refresh_tokens.updateMany({
      where: { token_hash: tokenHash, revoked: false },
      data: { revoked: true },
    });
  }

  clearTokenCookies(res);
}

/**
 * Get current user info (attached to authenticated requests).
 */
export async function getCurrentUser(userId: string): Promise<AuthUser> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      company: { select: { name: true, logo_url: true } },
    },
  });

  if (!user) throw new NotFoundError('User not found');

  return buildAuthUser(user);
}

/**
 * Change password (FR-17, Security Checklist #19).
 *
 * - Verifies current password
 * - Validates new password against policy
 * - Hashes and updates
 * - Sets must_change_password = false
 * - Revokes all refresh tokens (force re-login)
 */
export async function changePassword(
  userId: string,
  dto: ChangePasswordDTO,
  res: Response,
): Promise<void> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) throw new NotFoundError('User not found');

  // Verify current password
  const valid = await comparePassword(dto.currentPassword, user.password_hash);
  if (!valid) {
    throw new BadRequestError('Current password is incorrect');
  }

  // Hash new password and update
  const newHash = await hashPassword(dto.newPassword);

  await prisma.$transaction([
    prisma.users.update({
      where: { id: userId },
      data: {
        password_hash: newHash,
        must_change_password: false,
        updated_at: new Date(),
      },
    }),
    // Revoke all refresh tokens — force re-login on all sessions
    prisma.refresh_tokens.updateMany({
      where: { user_id: userId, revoked: false },
      data: { revoked: true },
    }),
  ]);

  clearTokenCookies(res);
}
