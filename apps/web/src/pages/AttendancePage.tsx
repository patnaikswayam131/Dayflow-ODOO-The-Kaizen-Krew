import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Attendance Page (FR-20–FR-23).
 * TODO (Dev 3 — feat/attendance-leave): Implement:
 * - Employee view: day-wise attendance, current month, prev/next navigation (FR-21)
 * - Admin/HR view: all employees, filterable by date, default "today" (FR-22)
 * - Status derivation: Present / Absent / Half-day / Leave (FR-23)
 */
export function AttendancePage() {
  useDocumentTitle('Attendance');

  return (
    <div>
      <h1 className="text-heading-lg text-ink-deep mb-xxl">Attendance</h1>

      {/* Empty state */}
      <div className="card p-section text-center">
        <p className="text-body-md text-steel mb-xs">No attendance records yet</p>
        <p className="text-body-sm text-stone">
          Attendance tracking will be implemented in{' '}
          <code className="bg-surface-soft px-xxs py-[2px] rounded-sm text-body-sm-bold text-ink">
            feat/attendance-leave
          </code>
        </p>
      </div>
    </div>
  );
}
