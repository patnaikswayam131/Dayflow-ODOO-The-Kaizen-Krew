import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Dashboard Page — Landing page after login (FR-6).
 * All roles land here; visible modules differ by role.
 * TODO: Add role-based dashboard widgets.
 */
export function DashboardPage() {
  useDocumentTitle('Dashboard');

  return (
    <div>
      <h1 className="text-heading-lg text-ink-deep mb-xxl">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl-sp">
        <DashboardCard
          title="Employees"
          description="View and manage employee records"
          link="/app/employees"
          branch="feat/employee-profile"
        />
        <DashboardCard
          title="Attendance"
          description="Track check-ins, work hours, and attendance records"
          link="/app/attendance"
          branch="feat/attendance-leave"
        />
        <DashboardCard
          title="Time Off"
          description="Manage leave requests and balances"
          link="/app/time-off"
          branch="feat/attendance-leave"
        />
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  link,
  branch,
}: {
  title: string;
  description: string;
  link: string;
  branch: string;
}) {
  return (
    <a
      href={link}
      className="card hover:shadow-sticky-panel transition-shadow duration-150 ease-out block"
    >
      <h2 className="text-heading-sm text-ink-deep mb-xs">{title}</h2>
      <p className="text-body-sm text-steel mb-base">{description}</p>
      <span className="text-caption text-stone">
        Branch: <code className="bg-surface-soft px-xxs py-[2px] rounded-sm">{branch}</code>
      </span>
    </a>
  );
}
