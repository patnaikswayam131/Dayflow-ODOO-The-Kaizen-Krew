import { UserRole, UserStatus } from './enums.js';

// ─── User Types ───
// Matches `users` table from Dayflow_schema.sql

export interface User {
  id: string;
  companyId: string;
  loginId: string;
  empCode: string;
  email: string;
  personalEmail: string | null;
  role: UserRole;
  status: UserStatus;

  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;

  department: string | null;
  jobPosition: string | null;
  managerId: string | null;
  location: string | null;
  dateOfJoining: string;

  // Private Info
  dateOfBirth: string | null;
  residingAddress: string | null;
  nationality: string | null;
  gender: string | null;
  maritalStatus: string | null;
  panNo: string | null;
  uanNo: string | null;

  // Resume
  about: string | null;
  jobLoveText: string | null;
  interests: string | null;

  createdAt: string;
  updatedAt: string;
}

/** Employee directory card (FR-9, FR-10) */
export interface EmployeeCard {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  department: string | null;
  jobPosition: string | null;
  status: UserStatus;
  /** Attendance-derived: 'present' | 'on_leave' | 'absent' */
  presenceStatus?: 'present' | 'on_leave' | 'absent';
}

/** Create Employee DTO (Admin/HR only, FR-3, FR-4) */
export interface CreateEmployeeDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  department?: string;
  jobPosition?: string;
  managerId?: string;
  location?: string;
  dateOfJoining: string;
}

/** Create Employee response — includes one-time-visible generated password */
export interface CreateEmployeeResponse {
  user: Pick<User, 'id' | 'loginId' | 'empCode' | 'email' | 'firstName' | 'lastName' | 'role'>;
  /** Shown ONCE to the creating Admin/HR, never stored or logged in plaintext (Security Checklist #9) */
  generatedPassword: string;
}

/** Update own profile DTO (Employee self-edit, FR-15) */
export interface UpdateOwnProfileDTO {
  phone?: string;
  residingAddress?: string;
  personalEmail?: string;
  about?: string;
  jobLoveText?: string;
  interests?: string;
}

/** Update any employee DTO (Admin/HR, FR-15) */
export interface UpdateEmployeeDTO extends UpdateOwnProfileDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  jobPosition?: string;
  managerId?: string | null;
  location?: string;
  dateOfBirth?: string;
  nationality?: string;
  gender?: string;
  maritalStatus?: string;
  panNo?: string;
  uanNo?: string;
  role?: UserRole;
  status?: UserStatus;
}

// ─── Bank Details (1:1 with User) ───
export interface BankDetails {
  userId: string;
  accountNumber: string;
  bankName: string | null;
  ifscCode: string | null;
  updatedAt: string;
}

export interface UpsertBankDetailsDTO {
  accountNumber: string;
  bankName?: string;
  ifscCode?: string;
}

// ─── Skills ───
export interface Skill {
  id: string;
  userId: string;
  name: string;
}

// ─── Certifications ───
export interface Certification {
  id: string;
  userId: string;
  name: string;
  issuedBy: string | null;
  issuedOn: string | null;
}

export interface CreateCertificationDTO {
  name: string;
  issuedBy?: string;
  issuedOn?: string;
}
