import { LeaveStatus } from './enums.js';

// ─── Leave Types ───
// Matches `leave_types`, `leave_balances`, `leave_requests` from Dayflow_schema.sql

export interface LeaveType {
  id: string;
  companyId: string;
  name: string;
  isPaid: boolean;
  requiresAttachment: boolean;
  defaultAllocationDays: number;
}

export interface LeaveBalance {
  id: string;
  userId: string;
  leaveTypeId: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  /** Computed: allocatedDays - usedDays */
  availableDays: number;
  /** Joined from leave_types for convenience */
  leaveTypeName?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  remarks: string | null;
  attachmentUrl: string | null;
  status: LeaveStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  createdAt: string;
  /** Joined fields for display */
  leaveTypeName?: string;
  employeeName?: string;
  reviewerName?: string;
}

/** Create Leave Request DTO (FR-26) */
export interface CreateLeaveRequestDTO {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  remarks?: string;
  // attachment handled via multipart form, not JSON
}

/** Approve/Reject Leave DTO (FR-28) */
export interface ReviewLeaveRequestDTO {
  status: LeaveStatus.APPROVED | LeaveStatus.REJECTED;
  reviewComment?: string;
}
