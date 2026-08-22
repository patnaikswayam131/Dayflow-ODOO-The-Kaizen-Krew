import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Employees Page — Employee directory (FR-9).
 * TODO (Dev 2 — feat/employee-profile): Implement:
 * - Searchable card grid with avatar, name, status indicator (FR-9, FR-10)
 * - "New Employee" button for Admin/HR only
 * - Click-through to employee profile view
 */
export function EmployeesPage() {
  useDocumentTitle('Employees');

  return (
    <div>
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-heading-lg text-ink-deep">Employees</h1>
        {/* TODO: Show only for Admin/HR roles */}
        <button className="btn-primary" disabled>
          + New Employee
        </button>
      </div>

      {/* Empty state (SRS §6.3) */}
      <div className="card p-section text-center">
        <p className="text-body-md text-steel mb-xs">No employees yet</p>
        <p className="text-body-sm text-stone">
          Employee directory will be implemented in{' '}
          <code className="bg-surface-soft px-xxs py-[2px] rounded-sm text-body-sm-bold text-ink">
            feat/employee-profile
          </code>
        </p>
      </div>
    </div>
  );
}
