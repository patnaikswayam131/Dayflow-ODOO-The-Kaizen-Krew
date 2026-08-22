import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSalaryStructure } from '../salaryEngine.js';
import { calculatePayableDays } from '../payableDaysEngine.js';
import { SalaryComponentKey, ComputationType, PercentageBase } from '../enums.js';

describe('Salary Engine Tests (SRS §8 Fixture)', () => {
  it('should correctly calculate salary structure for ₹50,000 monthly wage per SRS §8 worked example', () => {
    const result = calculateSalaryStructure(50000);

    assert.equal(result.monthlyWage, 50000);
    assert.equal(result.yearlyWage, 600000);
    assert.equal(result.totalEarnings, 50000);

    const getComp = (key: SalaryComponentKey) =>
      result.components.find((c) => c.componentKey === key)!;

    // Basic: 50% of Wage = ₹25,000.00
    const basic = getComp(SalaryComponentKey.BASIC);
    assert.equal(basic.computedAmount, 25000.0);

    // HRA: 50% of Basic = ₹12,500.00
    const hra = getComp(SalaryComponentKey.HRA);
    assert.equal(hra.computedAmount, 12500.0);

    // Standard Allowance: Fixed = ₹4,167.00
    const stdAllow = getComp(SalaryComponentKey.STANDARD_ALLOWANCE);
    assert.equal(stdAllow.computedAmount, 4167.0);

    // Performance Bonus: 8.33% of Basic = ₹2,082.50
    const perfBonus = getComp(SalaryComponentKey.PERFORMANCE_BONUS);
    assert.equal(perfBonus.computedAmount, 2082.5);

    // LTA: 8.33% of Basic = ₹2,082.50
    const lta = getComp(SalaryComponentKey.LTA);
    assert.equal(lta.computedAmount, 2082.5);

    // Fixed Allowance: Residual = ₹4,168.00 (50,000 - (25000 + 12500 + 4167 + 2082.5 + 2082.5))
    const fixedAllow = getComp(SalaryComponentKey.FIXED_ALLOWANCE);
    assert.equal(fixedAllow.computedAmount, 4168.0);

    // Employee PF: 12% of Basic = ₹3,000.00
    const pfEmp = getComp(SalaryComponentKey.PF_EMPLOYEE);
    assert.equal(pfEmp.computedAmount, 3000.0);

    // Employer PF: 12% of Basic = ₹3,000.00
    const pfEmployer = getComp(SalaryComponentKey.PF_EMPLOYER);
    assert.equal(pfEmployer.computedAmount, 3000.0);

    // Professional Tax: Fixed = ₹200.00
    const profTax = getComp(SalaryComponentKey.PROFESSIONAL_TAX);
    assert.equal(profTax.computedAmount, 200.0);

    // Totals
    assert.equal(result.totalEmployeeDeductions, 3200.0);
    assert.equal(result.totalEmployerDeductions, 3000.0);
    assert.equal(result.netPay, 46800.0);
  });

  it('should reject with specific error if sum of earning components exceeds monthly wage (FR-34)', () => {
    const invalidComponents = [
      {
        componentKey: SalaryComponentKey.BASIC,
        computationType: ComputationType.PERCENTAGE,
        percentageBase: PercentageBase.WAGE,
        configuredValue: 80.0, // 80% = 40,000
      },
      {
        componentKey: SalaryComponentKey.HRA,
        computationType: ComputationType.PERCENTAGE,
        percentageBase: PercentageBase.BASIC,
        configuredValue: 50.0, // 50% of 40,000 = 20,000 -> Sum 60,000 > 50,000
      },
    ];

    assert.throws(
      () => calculateSalaryStructure(50000, invalidComponents),
      /Sum of earning components exceeds monthly wage/
    );
  });

  it('should recompute percentage components and residual fixed allowance when wage changes (FR-35)', () => {
    const result100k = calculateSalaryStructure(100000);
    assert.equal(result100k.yearlyWage, 1200000);
    const basic100 = result100k.components.find((c) => c.componentKey === SalaryComponentKey.BASIC)!;
    assert.equal(basic100.computedAmount, 50000); // 50% of 100,000
    assert.equal(result100k.totalEarnings, 100000);
  });
});

describe('Payable Days Engine Tests (FR-37)', () => {
  it('should calculate payable days correctly', () => {
    const res = calculatePayableDays({
      totalWorkingDays: 22,
      unpaidLeaveDays: 2,
      absentDays: 1,
    });

    assert.equal(res.payableDays, 19); // 22 - 2 - 1
  });
});
