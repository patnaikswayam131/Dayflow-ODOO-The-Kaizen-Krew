import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Time Off Page (FR-24–FR-29).
 * TODO (Dev 3 — feat/attendance-leave): Implement:
 * - Leave balance display per type per year (FR-25)
 * - Leave request form with type, dates, auto-computed days, remarks (FR-26)
 * - Request list with status badges (FR-27)
 * - Admin/HR: approval/rejection workflow with review comment (FR-28)
 * - Overlap validation (FR-29)
 */
export function TimeOffPage() {
  useDocumentTitle('Time Off');

  return (
    <div>
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-heading-lg text-ink-deep">Time Off</h1>
        <button className="btn-primary" disabled>
          + New Request
        </button>
      </div>

      {/* Empty state */}
      <div className="card p-section text-center">
        <p className="text-body-md text-steel mb-xs">No leave requests yet</p>
        <p className="text-body-sm text-stone">
          Leave management will be implemented in{' '}
          <code className="bg-surface-soft px-xxs py-[2px] rounded-sm text-body-sm-bold text-ink">
            feat/attendance-leave
          </code>
        </p>
      </div>
    </div>
  );
}
