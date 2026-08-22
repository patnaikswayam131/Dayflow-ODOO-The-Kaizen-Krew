import { ComputationType, PercentageBase, SalaryComponentKey } from './enums.js';
import type { SalaryComponentInput } from './salary.js';

export interface CalculatedSalaryComponent {
  componentKey: SalaryComponentKey;
  computationType: ComputationType;
  percentageBase: PercentageBase | null;
  configuredValue: number;
  computedAmount: number;
}

export interface SalaryCalculationResult {
  monthlyWage: number;
  yearlyWage: number;
  components: CalculatedSalaryComponent[];
  totalEarnings: number;
  totalEmployeeDeductions: number;
  totalEmployerDeductions: number;
  netPay: number;
}

export const DEFAULT_SALARY_COMPONENTS: SalaryComponentInput[] = [
  {
    componentKey: SalaryComponentKey.BASIC,
    computationType: ComputationType.PERCENTAGE,
    percentageBase: PercentageBase.WAGE,
    configuredValue: 50.0,
  },
  {
    componentKey: SalaryComponentKey.HRA,
    computationType: ComputationType.PERCENTAGE,
    percentageBase: PercentageBase.BASIC,
    configuredValue: 50.0,
  },
  {
    componentKey: SalaryComponentKey.STANDARD_ALLOWANCE,
    computationType: ComputationType.FIXED_AMOUNT,
    percentageBase: null,
    configuredValue: 4167.0,
  },
  {
    componentKey: SalaryComponentKey.PERFORMANCE_BONUS,
    computationType: ComputationType.PERCENTAGE,
    percentageBase: PercentageBase.BASIC,
    configuredValue: 8.33,
  },
  {
    componentKey: SalaryComponentKey.LTA,
    computationType: ComputationType.PERCENTAGE,
    percentageBase: PercentageBase.BASIC,
    configuredValue: 8.33,
  },
  {
    componentKey: SalaryComponentKey.PF_EMPLOYEE,
    computationType: ComputationType.PERCENTAGE,
    percentageBase: PercentageBase.BASIC,
    configuredValue: 12.0,
  },
  {
    componentKey: SalaryComponentKey.PF_EMPLOYER,
    computationType: ComputationType.PERCENTAGE,
    percentageBase: PercentageBase.BASIC,
    configuredValue: 12.0,
  },
  {
    componentKey: SalaryComponentKey.PROFESSIONAL_TAX,
    computationType: ComputationType.FIXED_AMOUNT,
    percentageBase: null,
    configuredValue: 200.0,
  },
];

/**
 * Pure function to calculate salary structure components, yearly wage,
 * residual fixed allowance, and deductions (FR-31 to FR-35).
 */
export function calculateSalaryStructure(
  monthlyWage: number,
  customComponents?: SalaryComponentInput[]
): SalaryCalculationResult {
  if (monthlyWage <= 0 || !Number.isFinite(monthlyWage)) {
    throw new Error('Monthly wage must be a positive number');
  }

  // FR-31: Yearly Wage is always Monthly Wage * 12
  const yearlyWage = Math.round(monthlyWage * 12 * 100) / 100;

  const rawInputs = customComponents && customComponents.length > 0
    ? customComponents
    : DEFAULT_SALARY_COMPONENTS;

  // Map inputs into working list (ignoring any passed FIXED_ALLOWANCE since it's residual)
  const inputMap = new Map<SalaryComponentKey, SalaryComponentInput>();
  for (const item of rawInputs) {
    if (item.componentKey !== SalaryComponentKey.FIXED_ALLOWANCE) {
      inputMap.set(item.componentKey, item);
    }
  }

  // Ensure default presence if not supplied
  for (const def of DEFAULT_SALARY_COMPONENTS) {
    if (!inputMap.has(def.componentKey)) {
      inputMap.set(def.componentKey, def);
    }
  }

  const results: CalculatedSalaryComponent[] = [];

  const round2 = (num: number) => Math.round(num * 100) / 100;

  // 1. Compute BASIC first because other percentage components depend on BASIC
  const basicInput = inputMap.get(SalaryComponentKey.BASIC)!;
  let basicAmount = 0;
  if (basicInput.computationType === ComputationType.PERCENTAGE) {
    // Basic is % of Wage
    basicAmount = round2((monthlyWage * basicInput.configuredValue) / 100);
  } else {
    basicAmount = round2(basicInput.configuredValue);
  }

  results.push({
    componentKey: SalaryComponentKey.BASIC,
    computationType: basicInput.computationType,
    percentageBase: basicInput.percentageBase ?? PercentageBase.WAGE,
    configuredValue: basicInput.configuredValue,
    computedAmount: basicAmount,
  });

  // Earning component order (excluding BASIC and FIXED_ALLOWANCE)
  const earningKeys: SalaryComponentKey[] = [
    SalaryComponentKey.HRA,
    SalaryComponentKey.STANDARD_ALLOWANCE,
    SalaryComponentKey.PERFORMANCE_BONUS,
    SalaryComponentKey.LTA,
  ];

  let sumNonResidualEarnings = basicAmount;

  for (const key of earningKeys) {
    const input = inputMap.get(key)!;
    let amount = 0;
    if (input.computationType === ComputationType.PERCENTAGE) {
      const base = input.percentageBase === PercentageBase.WAGE ? monthlyWage : basicAmount;
      amount = round2((base * input.configuredValue) / 100);
    } else {
      amount = round2(input.configuredValue);
    }

    results.push({
      componentKey: key,
      computationType: input.computationType,
      percentageBase: input.percentageBase ?? null,
      configuredValue: input.configuredValue,
      computedAmount: amount,
    });

    sumNonResidualEarnings = round2(sumNonResidualEarnings + amount);
  }

  // FR-34: Validation: sum of earning components must be <= Monthly Wage
  if (sumNonResidualEarnings > monthlyWage) {
    throw new Error('Sum of earning components exceeds monthly wage');
  }

  // FR-32: Fixed Allowance is Residual = Wage - sum of all other earning components
  const fixedAllowanceAmount = round2(monthlyWage - sumNonResidualEarnings);

  results.push({
    componentKey: SalaryComponentKey.FIXED_ALLOWANCE,
    computationType: ComputationType.FIXED_AMOUNT,
    percentageBase: null,
    configuredValue: fixedAllowanceAmount,
    computedAmount: fixedAllowanceAmount,
  });

  const totalEarnings = round2(sumNonResidualEarnings + fixedAllowanceAmount);

  // 2. Compute Deductions (PF_EMPLOYEE, PF_EMPLOYER, PROFESSIONAL_TAX)
  const deductionKeys: { key: SalaryComponentKey; isEmployee: boolean }[] = [
    { key: SalaryComponentKey.PF_EMPLOYEE, isEmployee: true },
    { key: SalaryComponentKey.PF_EMPLOYER, isEmployee: false },
    { key: SalaryComponentKey.PROFESSIONAL_TAX, isEmployee: true },
  ];

  let totalEmployeeDeductions = 0;
  let totalEmployerDeductions = 0;

  for (const d of deductionKeys) {
    const input = inputMap.get(d.key)!;
    let amount = 0;
    if (input.computationType === ComputationType.PERCENTAGE) {
      const base = input.percentageBase === PercentageBase.WAGE ? monthlyWage : basicAmount;
      amount = round2((base * input.configuredValue) / 100);
    } else {
      amount = round2(input.configuredValue);
    }

    results.push({
      componentKey: d.key,
      computationType: input.computationType,
      percentageBase: input.percentageBase ?? null,
      configuredValue: input.configuredValue,
      computedAmount: amount,
    });

    if (d.isEmployee) {
      totalEmployeeDeductions = round2(totalEmployeeDeductions + amount);
    } else {
      totalEmployerDeductions = round2(totalEmployerDeductions + amount);
    }
  }

  const netPay = round2(totalEarnings - totalEmployeeDeductions);

  return {
    monthlyWage,
    yearlyWage,
    components: results,
    totalEarnings,
    totalEmployeeDeductions,
    totalEmployerDeductions,
    netPay,
  };
}
