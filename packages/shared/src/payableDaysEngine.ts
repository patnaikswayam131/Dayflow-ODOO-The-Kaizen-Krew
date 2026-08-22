import type { PayableDaysResult } from './salary.js';

export interface PayableDaysInput {
  totalWorkingDays: number;
  unpaidLeaveDays: number;
  absentDays: number;
}

/**
 * Pure function to calculate payable days for a payroll period (FR-37).
 * Payable Days = Total Working Days in Period - Unpaid Leave Days - Unexplained Absent Days
 */
export function calculatePayableDays(input: PayableDaysInput): PayableDaysResult {
  const { totalWorkingDays, unpaidLeaveDays, absentDays } = input;

  if (totalWorkingDays < 0 || unpaidLeaveDays < 0 || absentDays < 0) {
    throw new Error('Working days, unpaid leave, and absent days cannot be negative');
  }

  const payableDays = Math.max(0, totalWorkingDays - unpaidLeaveDays - absentDays);

  return {
    totalWorkingDays,
    unpaidLeaveDays,
    absentDays,
    payableDays,
  };
}
