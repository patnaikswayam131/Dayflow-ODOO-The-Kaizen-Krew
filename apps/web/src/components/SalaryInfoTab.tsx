import { useState, useMemo, useEffect } from 'react';
import {
  calculateSalaryStructure,
  SalaryComponentKey,
  ComputationType,
  PercentageBase,
  UserRole,
  type SalaryComponentInput,
} from '@dayflow/shared';

interface SalaryInfoTabProps {
  userId: string;
  currentUserRole?: UserRole;
  isSelf?: boolean;
  initialMonthlyWage?: number;
  initialComponents?: SalaryComponentInput[];
  onSave?: (data: { monthlyWage: number; components: SalaryComponentInput[] }) => Promise<void>;
}

export function SalaryInfoTab({
  userId,
  currentUserRole = UserRole.EMPLOYEE,
  isSelf = false,
  initialMonthlyWage = 50000,
  initialComponents,
  onSave,
}: SalaryInfoTabProps) {
  // Permission rules per SRS §3 resolution 3:
  // - Employee: view OWN salary info tab (read-only)
  // - Admin: view and EDIT any employee's salary info tab
  // - HR Officer: view ANY employee's salary info tab (read-only, cannot edit)
  const canEdit = currentUserRole === UserRole.ADMIN;

  const [isEditing, setIsEditing] = useState(false);
  const [monthlyWage, setMonthlyWage] = useState(initialMonthlyWage);
  const [basicPct, setBasicPct] = useState(50);
  const [hraPct, setHraPct] = useState(50);
  const [stdAllowFixed, setStdAllowFixed] = useState(4167);
  const [perfBonusPct, setPerfBonusPct] = useState(8.33);
  const [ltaPct, setLtaPct] = useState(8.33);
  const [pfEmpPct, setPfEmpPct] = useState(12);
  const [pfEmployerPct, setPfEmployerPct] = useState(12);
  const [profTaxFixed, setProfTaxFixed] = useState(200);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize from props if supplied
  useEffect(() => {
    if (initialMonthlyWage) setMonthlyWage(initialMonthlyWage);
    if (initialComponents && initialComponents.length > 0) {
      for (const comp of initialComponents) {
        if (comp.componentKey === SalaryComponentKey.BASIC) setBasicPct(comp.configuredValue);
        if (comp.componentKey === SalaryComponentKey.HRA) setHraPct(comp.configuredValue);
        if (comp.componentKey === SalaryComponentKey.STANDARD_ALLOWANCE) setStdAllowFixed(comp.configuredValue);
        if (comp.componentKey === SalaryComponentKey.PERFORMANCE_BONUS) setPerfBonusPct(comp.configuredValue);
        if (comp.componentKey === SalaryComponentKey.LTA) setLtaPct(comp.configuredValue);
        if (comp.componentKey === SalaryComponentKey.PF_EMPLOYEE) setPfEmpPct(comp.configuredValue);
        if (comp.componentKey === SalaryComponentKey.PF_EMPLOYER) setPfEmployerPct(comp.configuredValue);
        if (comp.componentKey === SalaryComponentKey.PROFESSIONAL_TAX) setProfTaxFixed(comp.configuredValue);
      }
    }
  }, [initialMonthlyWage, initialComponents]);

  // Re-calculate live preview using shared calculation engine
  const calculationResult = useMemo(() => {
    try {
      const customComps: SalaryComponentInput[] = [
        {
          componentKey: SalaryComponentKey.BASIC,
          computationType: ComputationType.PERCENTAGE,
          percentageBase: PercentageBase.WAGE,
          configuredValue: basicPct,
        },
        {
          componentKey: SalaryComponentKey.HRA,
          computationType: ComputationType.PERCENTAGE,
          percentageBase: PercentageBase.BASIC,
          configuredValue: hraPct,
        },
        {
          componentKey: SalaryComponentKey.STANDARD_ALLOWANCE,
          computationType: ComputationType.FIXED_AMOUNT,
          percentageBase: null,
          configuredValue: stdAllowFixed,
        },
        {
          componentKey: SalaryComponentKey.PERFORMANCE_BONUS,
          computationType: ComputationType.PERCENTAGE,
          percentageBase: PercentageBase.BASIC,
          configuredValue: perfBonusPct,
        },
        {
          componentKey: SalaryComponentKey.LTA,
          computationType: ComputationType.PERCENTAGE,
          percentageBase: PercentageBase.BASIC,
          configuredValue: ltaPct,
        },
        {
          componentKey: SalaryComponentKey.PF_EMPLOYEE,
          computationType: ComputationType.PERCENTAGE,
          percentageBase: PercentageBase.BASIC,
          configuredValue: pfEmpPct,
        },
        {
          componentKey: SalaryComponentKey.PF_EMPLOYER,
          computationType: ComputationType.PERCENTAGE,
          percentageBase: PercentageBase.BASIC,
          configuredValue: pfEmployerPct,
        },
        {
          componentKey: SalaryComponentKey.PROFESSIONAL_TAX,
          computationType: ComputationType.FIXED_AMOUNT,
          percentageBase: null,
          configuredValue: profTaxFixed,
        },
      ];

      return {
        data: calculateSalaryStructure(monthlyWage, customComps),
        error: null,
      };
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Invalid salary parameters',
      };
    }
  }, [
    monthlyWage,
    basicPct,
    hraPct,
    stdAllowFixed,
    perfBonusPct,
    ltaPct,
    pfEmpPct,
    pfEmployerPct,
    profTaxFixed,
  ]);

  const handleSave = async () => {
    if (!canEdit) return;
    if (calculationResult.error || !calculationResult.data) {
      setErrorMsg(calculationResult.error || 'Cannot save invalid salary structure');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (onSave) {
        await onSave({
          monthlyWage,
          components: [
            {
              componentKey: SalaryComponentKey.BASIC,
              computationType: ComputationType.PERCENTAGE,
              percentageBase: PercentageBase.WAGE,
              configuredValue: basicPct,
            },
            {
              componentKey: SalaryComponentKey.HRA,
              computationType: ComputationType.PERCENTAGE,
              percentageBase: PercentageBase.BASIC,
              configuredValue: hraPct,
            },
            {
              componentKey: SalaryComponentKey.STANDARD_ALLOWANCE,
              computationType: ComputationType.FIXED_AMOUNT,
              percentageBase: null,
              configuredValue: stdAllowFixed,
            },
            {
              componentKey: SalaryComponentKey.PERFORMANCE_BONUS,
              computationType: ComputationType.PERCENTAGE,
              percentageBase: PercentageBase.BASIC,
              configuredValue: perfBonusPct,
            },
            {
              componentKey: SalaryComponentKey.LTA,
              computationType: ComputationType.PERCENTAGE,
              percentageBase: PercentageBase.BASIC,
              configuredValue: ltaPct,
            },
            {
              componentKey: SalaryComponentKey.PF_EMPLOYEE,
              computationType: ComputationType.PERCENTAGE,
              percentageBase: PercentageBase.BASIC,
              configuredValue: pfEmpPct,
            },
            {
              componentKey: SalaryComponentKey.PF_EMPLOYER,
              computationType: ComputationType.PERCENTAGE,
              percentageBase: PercentageBase.BASIC,
              configuredValue: pfEmployerPct,
            },
            {
              componentKey: SalaryComponentKey.PROFESSIONAL_TAX,
              computationType: ComputationType.FIXED_AMOUNT,
              percentageBase: null,
              configuredValue: profTaxFixed,
            },
          ],
        });
      }
      setSuccessMsg('Salary structure updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save salary structure');
    } finally {
      setSaving(false);
    }
  };

  const calc = calculationResult.data;

  const earningsList = calc
    ? calc.components.filter((c) =>
        [
          SalaryComponentKey.BASIC,
          SalaryComponentKey.HRA,
          SalaryComponentKey.STANDARD_ALLOWANCE,
          SalaryComponentKey.PERFORMANCE_BONUS,
          SalaryComponentKey.LTA,
          SalaryComponentKey.FIXED_ALLOWANCE,
        ].includes(c.componentKey)
      )
    : [];

  const deductionsList = calc
    ? calc.components.filter((c) =>
        [
          SalaryComponentKey.PF_EMPLOYEE,
          SalaryComponentKey.PF_EMPLOYER,
          SalaryComponentKey.PROFESSIONAL_TAX,
        ].includes(c.componentKey)
      )
    : [];

  return (
    <div className="space-y-xxl" data-user-id={userId} data-is-self={isSelf}>
      {/* ── Header Banner ── */}
      <div className="bg-canvas border border-hairline-soft rounded-xxl p-xl flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <span className="text-caption-bold text-steel uppercase tracking-wider">
            Compensation Overview
          </span>
          <div className="flex items-baseline gap-base mt-xxs">
            <span className="text-display-lg text-ink-deep font-semibold">
              ₹{(calc?.monthlyWage || monthlyWage).toLocaleString('en-IN')}
            </span>
            <span className="text-body-sm text-steel">/ month</span>
            <span className="text-body-sm-bold text-primary bg-surface-soft px-md py-xxs rounded-full ml-xs">
              Yearly: ₹{(calc?.yearlyWage || monthlyWage * 12).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {canEdit && (
          <div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-ink-button text-on-ink-button hover:bg-charcoal px-xl py-md rounded-full text-button-md transition-colors"
              >
                Edit Salary Structure
              </button>
            ) : (
              <div className="flex items-center gap-xs">
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-canvas text-ink border border-hairline hover:bg-surface-soft px-lg py-md rounded-full text-button-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !!calculationResult.error}
                  className="bg-primary text-on-primary hover:bg-primary-deep disabled:bg-disabled-text px-xl py-md rounded-full text-button-md transition-colors"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        )}

        {!canEdit && (
          <div className="text-caption text-steel bg-surface-soft px-md py-xs rounded-lg border border-hairline-soft">
            {currentUserRole === UserRole.HR_OFFICER
              ? 'HR Officer View (Read-Only)'
              : 'Employee View (Read-Only)'}
          </div>
        )}
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="bg-canvas border border-critical-strong text-critical text-body-sm rounded-lg p-md">
          ⚠️ {errorMsg}
        </div>
      )}
      {calculationResult.error && isEditing && (
        <div className="bg-canvas border border-critical-strong text-critical text-body-sm rounded-lg p-md">
          ⚠️ {calculationResult.error}
        </div>
      )}
      {successMsg && (
        <div className="bg-canvas border border-success text-success text-body-sm rounded-lg p-md">
          ✓ {successMsg}
        </div>
      )}

      {/* ── Interactive Editor for Admin ── */}
      {isEditing && (
        <div className="bg-canvas border border-hairline-soft rounded-xxl p-xxl space-y-xl">
          <h3 className="text-heading-sm text-ink-deep font-medium">
            Configure Salary Components
          </h3>
          <p className="text-body-sm text-steel">
            Monthly Wage is the single source input. Changing values recomputes percentage-based
            components, and <strong>Fixed Allowance</strong> calculates last as the residual.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            <div>
              <label className="block text-body-sm-bold text-ink mb-xs">
                Monthly Wage (₹)
              </label>
              <input
                type="number"
                value={monthlyWage}
                onChange={(e) => setMonthlyWage(Math.max(1, Number(e.target.value)))}
                className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
              />
              <span className="text-caption text-steel mt-xxs block">
                Yearly Wage: ₹{(monthlyWage * 12).toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <label className="block text-body-sm-bold text-ink mb-xs">
                Basic Salary (% of Wage)
              </label>
              <input
                type="number"
                step="0.1"
                value={basicPct}
                onChange={(e) => setBasicPct(Number(e.target.value))}
                className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
              />
            </div>

            <div>
              <label className="block text-body-sm-bold text-ink mb-xs">
                HRA (% of Basic)
              </label>
              <input
                type="number"
                step="0.1"
                value={hraPct}
                onChange={(e) => setHraPct(Number(e.target.value))}
                className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
              />
            </div>

            <div>
              <label className="block text-body-sm-bold text-ink mb-xs">
                Standard Allowance (Fixed ₹)
              </label>
              <input
                type="number"
                value={stdAllowFixed}
                onChange={(e) => setStdAllowFixed(Number(e.target.value))}
                className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
              />
            </div>

            <div>
              <label className="block text-body-sm-bold text-ink mb-xs">
                Performance Bonus (% of Basic)
              </label>
              <input
                type="number"
                step="0.01"
                value={perfBonusPct}
                onChange={(e) => setPerfBonusPct(Number(e.target.value))}
                className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
              />
            </div>

            <div>
              <label className="block text-body-sm-bold text-ink mb-xs">
                LTA (% of Basic)
              </label>
              <input
                type="number"
                step="0.01"
                value={ltaPct}
                onChange={(e) => setLtaPct(Number(e.target.value))}
                className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
              />
            </div>

            <div>
              <label className="block text-body-sm-bold text-ink mb-xs">
                Employee PF (% of Basic)
              </label>
              <input
                type="number"
                step="0.1"
                value={pfEmpPct}
                onChange={(e) => setPfEmpPct(Number(e.target.value))}
                className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
              />
            </div>

            <div>
              <label className="block text-body-sm-bold text-ink mb-xs">
                Employer PF (% of Basic)
              </label>
              <input
                type="number"
                step="0.1"
                value={pfEmployerPct}
                onChange={(e) => setPfEmployerPct(Number(e.target.value))}
                className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
              />
            </div>

            <div>
              <label className="block text-body-sm-bold text-ink mb-xs">
                Professional Tax (Fixed ₹)
              </label>
              <input
                type="number"
                value={profTaxFixed}
                onChange={(e) => setProfTaxFixed(Number(e.target.value))}
                className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Breakdown Tables (Earnings & Deductions) ── */}
      {calc && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl">
          {/* Earnings Card */}
          <div className="bg-canvas border border-hairline-soft rounded-xxl p-xxl space-y-lg">
            <div className="flex items-center justify-between border-b border-hairline-soft pb-md">
              <h3 className="text-subtitle-lg text-ink-deep font-semibold">Earnings</h3>
              <span className="text-subtitle-lg text-success font-bold">
                ₹{calc.totalEarnings.toLocaleString('en-IN')}
              </span>
            </div>

            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-steel text-left border-b border-hairline-soft">
                  <th className="pb-xs font-semibold">Component</th>
                  <th className="pb-xs font-semibold">Rule</th>
                  <th className="pb-xs font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {earningsList.map((comp) => (
                  <tr key={comp.componentKey}>
                    <td className="py-md font-medium text-ink">
                      {comp.componentKey === SalaryComponentKey.FIXED_ALLOWANCE ? (
                        <span>
                          Fixed Allowance{' '}
                          <span className="text-caption bg-surface-soft px-xs py-xxs rounded text-steel">
                            Residual
                          </span>
                        </span>
                      ) : (
                        comp.componentKey.replace(/_/g, ' ')
                      )}
                    </td>
                    <td className="py-md text-steel">
                      {comp.componentKey === SalaryComponentKey.FIXED_ALLOWANCE
                        ? 'Wage − Σ(others)'
                        : comp.computationType === ComputationType.PERCENTAGE
                        ? `${comp.configuredValue}% of ${comp.percentageBase}`
                        : `Fixed ₹${comp.configuredValue}`}
                    </td>
                    <td className="py-md text-right font-medium text-ink-deep">
                      ₹{comp.computedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Deductions Card */}
          <div className="bg-canvas border border-hairline-soft rounded-xxl p-xxl space-y-lg">
            <div className="flex items-center justify-between border-b border-hairline-soft pb-md">
              <h3 className="text-subtitle-lg text-ink-deep font-semibold">Deductions</h3>
              <span className="text-subtitle-lg text-critical font-bold">
                ₹{calc.totalEmployeeDeductions.toLocaleString('en-IN')}
              </span>
            </div>

            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-steel text-left border-b border-hairline-soft">
                  <th className="pb-xs font-semibold">Deduction</th>
                  <th className="pb-xs font-semibold">Rule</th>
                  <th className="pb-xs font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {deductionsList.map((comp) => (
                  <tr key={comp.componentKey}>
                    <td className="py-md font-medium text-ink">
                      {comp.componentKey === SalaryComponentKey.PF_EMPLOYER ? (
                        <span>
                          Employer PF{' '}
                          <span className="text-caption bg-surface-soft px-xs py-xxs rounded text-steel">
                            Informational
                          </span>
                        </span>
                      ) : (
                        comp.componentKey.replace(/_/g, ' ')
                      )}
                    </td>
                    <td className="py-md text-steel">
                      {comp.computationType === ComputationType.PERCENTAGE
                        ? `${comp.configuredValue}% of ${comp.percentageBase}`
                        : `Fixed ₹${comp.configuredValue}`}
                    </td>
                    <td className="py-md text-right font-medium text-ink-deep">
                      ₹{comp.computedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary Take Home */}
            <div className="bg-surface-soft rounded-xl p-lg flex items-center justify-between mt-base border border-hairline-soft">
              <div>
                <span className="text-body-sm-bold text-ink-deep block">Net Take-Home Pay</span>
                <span className="text-caption text-steel">Gross Earnings − Employee Deductions</span>
              </div>
              <span className="text-heading-sm text-primary font-bold">
                ₹{calc.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
