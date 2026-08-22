import { z } from 'zod';

// ─── Password policy (SRS §6.1, Security Checklist #19) ───
// Min 10 chars, upper + lower + number + symbol
export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one symbol');

// ─── Login DTO (FR-2) ───
export const loginSchema = z.object({
  identifier: z.string().min(1, 'Login ID or email is required'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginDTO = z.infer<typeof loginSchema>;

// ─── Company Bootstrap DTO (FR-1) ───
export const companyBootstrapSchema = z
  .object({
    companyName: z.string().min(1).max(255),
    loginPrefix: z.string().min(2).max(4),
    adminFirstName: z.string().min(1).max(100),
    adminLastName: z.string().min(1).max(100),
    adminEmail: z.string().email(),
    adminPhone: z.string().min(7).max(20).optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type CompanyBootstrapDTO = z.infer<typeof companyBootstrapSchema>;

// ─── Change Password DTO (FR-17) ───
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });
export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;

// ─── JWT Payload ───
export interface TokenPayload {
  userId: string;
  companyId: string;
  role: string;
  loginId: string;
}

// ─── Auth Response (sent to client after login) ───
export interface AuthUser {
  id: string;
  loginId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
  mustChangePassword: boolean;
  companyId: string;
  companyName: string;
  companyLogoUrl: string | null;
}
