// ─── Company Types ───
// Matches `companies` table from Dayflow_schema.sql

export interface Company {
  id: string;
  name: string;
  loginPrefix: string;
  logoUrl: string | null;
  workingDaysPerWeek: number;
  breakTimeMinutes: number;
  standardWorkHours: number;
  halfDayThresholdHours: number;
  createdAt: string;
  updatedAt: string;
}

/** Subset of Company fields editable by Admin (FR-36) */
export interface CompanySettingsDTO {
  workingDaysPerWeek: number;
  breakTimeMinutes: number;
  standardWorkHours: number;
  halfDayThresholdHours: number;
}
