// ─── Enums ───
// Mirrors the PostgreSQL enums from Dayflow_schema.sql exactly.

export enum UserRole {
  ADMIN = 'ADMIN',
  HR_OFFICER = 'HR_OFFICER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  LEAVE = 'LEAVE',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ComputationType {
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  PERCENTAGE = 'PERCENTAGE',
}

export enum PercentageBase {
  WAGE = 'WAGE',
  BASIC = 'BASIC',
}

export enum SalaryComponentKey {
  BASIC = 'BASIC',
  HRA = 'HRA',
  STANDARD_ALLOWANCE = 'STANDARD_ALLOWANCE',
  PERFORMANCE_BONUS = 'PERFORMANCE_BONUS',
  LTA = 'LTA',
  FIXED_ALLOWANCE = 'FIXED_ALLOWANCE',
  PROFESSIONAL_TAX = 'PROFESSIONAL_TAX',
  PF_EMPLOYEE = 'PF_EMPLOYEE',
  PF_EMPLOYER = 'PF_EMPLOYER',
}

/** Convenience union for "manager" roles (Admin + HR Officer) */
export const MANAGER_ROLES = [UserRole.ADMIN, UserRole.HR_OFFICER] as const;
export type ManagerRole = (typeof MANAGER_ROLES)[number];
