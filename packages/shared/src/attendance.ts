import { AttendanceStatus } from './enums.js';

// ─── Attendance Types ───
// Matches `attendance_records` table from Dayflow_schema.sql

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  workHours: number | null;
  extraHours: number | null;
  status: AttendanceStatus;
  createdAt: string;
}

/** Response after check-in/check-out (FR-19) */
export interface CheckInOutResponse {
  record: AttendanceRecord;
  /** Current check-in state for the status dot (FR-8) */
  isCheckedIn: boolean;
}

/** Query params for attendance list views (FR-21, FR-22) */
export interface AttendanceQuery {
  userId?: string;
  month?: number; // 1-12
  year?: number;
  date?: string; // ISO date for "today" admin view
  page?: number;
  pageSize?: number;
}
