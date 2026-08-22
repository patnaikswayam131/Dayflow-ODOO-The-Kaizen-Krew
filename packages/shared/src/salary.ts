import { ComputationType, PercentageBase, SalaryComponentKey } from './enums.js';

// ─── Salary Types ───
// Matches `salary_structures` and `salary_components` from Dayflow_schema.sql

export interface SalaryStructure {
  id: string;
  userId: string;
  monthlyWage: number;
  wageType: string; // 'FIXED' for MVP
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
  components?: SalaryComponent[];
}

export interface SalaryComponent {
  id: string;
  salaryStructureId: string;
  componentKey: SalaryComponentKey;
  computationType: ComputationType;
  percentageBase: PercentageBase | null;
  configuredValue: number;
  computedAmount: number;
}

/** DTO for creating/updating a salary structure (Admin only, FR-30–35) */
export interface UpsertSalaryStructureDTO {
  monthlyWage: number;
  effectiveFrom: string;
  components: SalaryComponentInput[];
}

export interface SalaryComponentInput {
  componentKey: SalaryComponentKey;
  computationType: ComputationType;
  percentageBase?: PercentageBase;
  configuredValue: number;
  // computedAmount is always server-computed, never trust client input
}

/** Payable days output (FR-37) — pure function result */
export interface PayableDaysResult {
  totalWorkingDays: number;
  unpaidLeaveDays: number;
  absentDays: number;
  payableDays: number;
}
