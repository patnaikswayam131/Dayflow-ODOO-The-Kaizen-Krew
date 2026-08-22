import { useState, useEffect } from 'react';
import type { CompanySettingsDTO } from '@dayflow/shared';

export function CompanySettingsPage() {
  const [settings, setSettings] = useState<CompanySettingsDTO>({
    workingDaysPerWeek: 5,
    breakTimeMinutes: 60,
    standardWorkHours: 8.0,
    halfDayThresholdHours: 4.0,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const res = await fetch('/api/v1/company/settings');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setSettings({
              workingDaysPerWeek: json.data.workingDaysPerWeek ?? 5,
              breakTimeMinutes: json.data.breakTimeMinutes ?? 60,
              standardWorkHours: json.data.standardWorkHours ?? 8.0,
              halfDayThresholdHours: json.data.halfDayThresholdHours ?? 4.0,
            });
          }
        }
      } catch (err: any) {
        console.error('Failed to load company settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/v1/company/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update company settings');
      }

      setSuccessMsg('Company settings updated successfully');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-xxl">
      {/* ── Single H1 for Security Checklist Part B #8–9 ── */}
      <div>
        <span className="text-caption-bold text-steel uppercase tracking-wider">
          Administration
        </span>
        <h1 className="text-heading-lg text-ink-deep font-semibold mt-xxs">
          Company Settings
        </h1>
        <p className="text-body-md text-steel mt-xs">
          Configure organization-wide work parameters backing attendance calculations and payable days (FR-36).
        </p>
      </div>

      {successMsg && (
        <div className="bg-canvas border border-success text-success text-body-sm rounded-lg p-md">
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-canvas border border-critical-strong text-critical text-body-sm rounded-lg p-md">
          ⚠️ {errorMsg}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-canvas border border-hairline-soft rounded-xxl p-xxl space-y-xl shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
          <div>
            <label
              htmlFor="workingDaysPerWeek"
              className="block text-body-sm-bold text-ink mb-xs"
            >
              Working Days per Week
            </label>
            <input
              id="workingDaysPerWeek"
              type="number"
              min="1"
              max="7"
              value={settings.workingDaysPerWeek}
              onChange={(e) =>
                setSettings({ ...settings, workingDaysPerWeek: Number(e.target.value) })
              }
              className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
              required
            />
            <span className="text-caption text-steel mt-xxs block">
              Standard work days per week (e.g. 5 days: Mon–Fri)
            </span>
          </div>

          <div>
            <label
              htmlFor="breakTimeMinutes"
              className="block text-body-sm-bold text-ink mb-xs"
            >
              Break Time (minutes / day)
            </label>
            <input
              id="breakTimeMinutes"
              type="number"
              min="0"
              value={settings.breakTimeMinutes}
              onChange={(e) =>
                setSettings({ ...settings, breakTimeMinutes: Number(e.target.value) })
              }
              className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
              required
            />
            <span className="text-caption text-steel mt-xxs block">
              Daily meal & break deduction (e.g. 60 minutes)
            </span>
          </div>

          <div>
            <label
              htmlFor="standardWorkHours"
              className="block text-body-sm-bold text-ink mb-xs"
            >
              Standard Daily Work Hours
            </label>
            <input
              id="standardWorkHours"
              type="number"
              step="0.5"
              min="1"
              max="24"
              value={settings.standardWorkHours}
              onChange={(e) =>
                setSettings({ ...settings, standardWorkHours: Number(e.target.value) })
              }
              className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
              required
            />
            <span className="text-caption text-steel mt-xxs block">
              Full workday duration (e.g. 8.00 hours)
            </span>
          </div>

          <div>
            <label
              htmlFor="halfDayThresholdHours"
              className="block text-body-sm-bold text-ink mb-xs"
            >
              Half-Day Threshold Hours
            </label>
            <input
              id="halfDayThresholdHours"
              type="number"
              step="0.5"
              min="0.5"
              max="12"
              value={settings.halfDayThresholdHours}
              onChange={(e) =>
                setSettings({ ...settings, halfDayThresholdHours: Number(e.target.value) })
              }
              className="w-full bg-canvas text-ink text-body-md rounded-lg p-md border border-hairline focus:border-fb-blue outline-none"
              required
            />
            <span className="text-caption text-steel mt-xxs block">
              Minimum hours worked for half-day status (default 4.00 hrs)
            </span>
          </div>
        </div>

        <div className="pt-md border-t border-hairline-soft flex justify-end">
          <button
            type="submit"
            disabled={saving || loading}
            className="bg-primary text-on-primary hover:bg-primary-deep disabled:bg-disabled-text px-xxl py-md rounded-full text-button-md transition-colors"
          >
            {saving ? 'Saving Settings…' : 'Save Company Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
