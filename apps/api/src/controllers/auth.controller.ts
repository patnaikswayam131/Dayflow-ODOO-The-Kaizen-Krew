import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } from '../lib/errors.js';
import { generateLoginIdAndEmpCode } from '../lib/loginIdGenerator.js';
import { validatePassword } from '../lib/password.js';
import { saveBase64File } from '../lib/fileUpload.js';
import { companyBootstrapSchema, loginSchema } from '@dayflow/shared';

// Helper to hash refresh tokens before database storage
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * 1. FR-1: One-time Company + Admin bootstrap signup
 */
export async function bootstrap(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Check if a company already exists
    const companyExists = await prisma.companies.count();
    if (companyExists > 0) {
      throw new ForbiddenError('Company bootstrap has already been completed. Only one company can be created in this demo.');
    }

    // Validate body using Zod schema
    const result = companyBootstrapSchema.safeParse(req.body);
    if (!result.success) {
      throw result.error;
    }
    const body = result.data;

    // Validate password policy explicitly (defense-in-depth)
    if (!validatePassword(body.password)) {
      throw new BadRequestError('Password does not meet strength requirements (must be at least 10 characters and contain mixed case, numbers, and symbols).');
    }

    let logoUrl: string | null = null;
    
    // Process logo upload if provided
    if (req.body.logo) {
      try {
        logoUrl = saveBase64File(
          req.body.logo,
          ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          5 * 1024 * 1024,
          'logos'
        );
      } catch (err) {
        throw new BadRequestError(err instanceof Error ? err.message : 'Logo upload failed');
      }
    }

    // Execute bootstrap transaction
    const bootstrapData = await prisma.$transaction(async (tx) => {
      // Create Company
      const company = await tx.companies.create({
        data: {
          name: body.companyName,
          login_prefix: body.loginPrefix.toUpperCase(),
          logo_url: logoUrl,
          working_days_per_week: 5,
          break_time_minutes: 60,
          standard_work_hours: 8.00,
          half_day_threshold_hours: 4.00,
        },
      });

      // Seed standard leave types for the company (needed for Dev 3 Time Off module)
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

      // Generate Login ID and Emp Code sequentially using row-level locking
      const { loginId, empCode } = await generateLoginIdAndEmpCode(
        tx,
        company.id,
        body.adminFirstName,
        body.adminLastName,
        new Date().getFullYear()
      );

      // Hash password
      const passwordHash = await bcrypt.hash(body.password, 10);

      // Create Admin User (Status is INACTIVE until email verification completes)
      const admin = await tx.users.create({
        data: {
          company_id: company.id,
          login_id: loginId,
          emp_code: empCode,
          email: body.adminEmail.toLowerCase(),
          password_hash: passwordHash,
          must_change_password: true,
          role: 'ADMIN',
          status: 'INACTIVE',
          first_name: body.adminFirstName,
          last_name: body.adminLastName,
          phone: body.adminPhone || null,
          date_of_joining: new Date(),
        },
      });

      return { company, admin, loginId };
    });

    // Generate signed email verification token (JWT valid for 24 hours)
    const verificationToken = jwt.sign(
      { userId: bootstrapData.admin.id, action: 'verify-email' },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '24h' }
    );

    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const verifyLink = `${protocol}://${req.get('host')}/api/v1/auth/verify-email?token=${verificationToken}`;
    
    // Log link to console for local testing (since actual mail sender is out of scope)
    console.log('\n[Dayflow Bootstrap] Verification Link for Admin:\n', verifyLink, '\n');

    res.status(201).json({
      success: true,
      data: {
        message: 'Company bootstrapped successfully. Please verify your email using the link sent or displayed in logs.',
        loginId: bootstrapData.loginId,
        verifyLink,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Verify bootstrap Admin email
 */
export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.query.token as string;
    if (!token) {
      throw new BadRequestError('Verification token is required');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
    } catch {
      throw new BadRequestError('Invalid or expired verification token');
    }

    if (decoded.action !== 'verify-email' || !decoded.userId) {
      throw new BadRequestError('Invalid token action');
    }

    // Activate the user
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.status === 'ACTIVE') {
      res.json({
        success: true,
        data: { message: 'Email already verified. You can login.' },
      });
      return;
    }

    await prisma.users.update({
      where: { id: user.id },
      data: { status: 'ACTIVE' },
    });

    res.json({
      success: true,
      data: { message: 'Email verified successfully. Your account is now active.' },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 2. FR-2: Sign-in with Login ID or Email + Password
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      throw result.error;
    }
    const { identifier, password } = result.data;

    // Search user by email or login_id
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { login_id: identifier },
          { email: identifier.toLowerCase() },
        ],
      },
      include: {
        company: {
          select: { name: true, logo_url: true },
        },
      },
    });

    // Generic error message on credentials mismatch (Security Checklist #2)
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Block login for inactive accounts (Security Checklist #4)
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Your account is deactivated. Please contact your HR/Admin.');
    }

    // Access token payload (Security Checklist #10)
    const tokenPayload = {
      userId: user.id,
      companyId: user.company_id,
      role: user.role,
      loginId: user.login_id,
    };

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any,
    });

    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as any,
    });

    // Save hashed refresh token in database (Security Checklist #10)
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refresh_tokens.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    // Set secure httpOnly cookies (Security Checklist #10)
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 mins
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    res.json({
      success: true,
      data: {
        user: {
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
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Token rotation refresh (Security Checklist #10)
 */
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    } catch {
      // Clear invalid cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      throw new UnauthorizedError('Invalid refresh token');
    }

    const userId = decoded.userId;
    const tokenHash = hashToken(refreshToken);

    // Verify token exists in database, is active, and is not expired
    const storedToken = await prisma.refresh_tokens.findFirst({
      where: {
        token_hash: tokenHash,
        revoked: false,
        expires_at: { gt: new Date() },
      },
    });

    // Reuse Detection: If a valid signature JWT is presented but isn't active in DB,
    // it could be a stolen token being replayed. Revoke all tokens for this user for security.
    if (!storedToken) {
      await prisma.refresh_tokens.updateMany({
        where: { user_id: userId },
        data: { revoked: true },
      });
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      throw new UnauthorizedError('Token has been revoked or reused');
    }

    // Delete/Revoke the old token (one-time usage)
    await prisma.refresh_tokens.delete({
      where: { id: storedToken.id },
    });

    // Fetch active user details
    const user = await prisma.users.findFirst({
      where: { id: userId, status: 'ACTIVE' },
      include: {
        company: {
          select: { name: true, logo_url: true },
        },
      },
    });

    if (!user) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      throw new UnauthorizedError('User account is deactivated or not found');
    }

    // Generate new Access and Refresh tokens
    const tokenPayload = {
      userId: user.id,
      companyId: user.company_id,
      role: user.role,
      loginId: user.login_id,
    };

    const newAccessToken = jwt.sign(tokenPayload, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any,
    });

    const newRefreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as any,
    });

    // Save new Refresh token hash
    const newHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refresh_tokens.create({
      data: {
        user_id: user.id,
        token_hash: newHash,
        expires_at: expiresAt,
      },
    });

    // Set cookies
    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      success: true,
      data: {
        user: {
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
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Logout and invalidate session
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      // Revoke the refresh token in database
      await prisma.refresh_tokens.deleteMany({
        where: { token_hash: tokenHash },
      });
    }

    // Clear cookies on client
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (err) {
    next(err);
  }
}
