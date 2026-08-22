import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AttendanceStatus, LeaveStatus, UserRole } from '@dayflow/shared';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

const formatStatus = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const attendanceTone = (status?: AttendanceStatus) => {
  if (status === AttendanceStatus.PRESENT) return 'border-success/30 bg-success/10 text-success';
  if (status === AttendanceStatus.LEAVE) return 'border-primary/30 bg-primary/10 text-primary';
  if (status === AttendanceStatus.HALF_DAY) return 'border-warning/40 bg-warning/10 text-ink-deep';
  return 'border-critical/30 bg-critical/10 text-critical';
};

const leaveTone = (status: LeaveStatus) => {
  if (status === LeaveStatus.APPROVED) return 'border-success/30 bg-success/10 text-success';
  if (status === LeaveStatus.PENDING) return 'border-warning/40 bg-warning/10 text-ink-deep';
  return 'border-critical/30 bg-critical/10 text-critical';
};

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const navigate = useNavigate();
  const {
    currentUser,
    currentRole,
    employees,
    attendanceRecords,
    leaveRequests,
    leaveBalances,
    isCheckedIn,
    toggleCheckIn,
    approveLeaveRequest,
    rejectLeaveRequest,
    logout,
  } = useAuth();

  const isManager = currentRole === UserRole.ADMIN || currentRole === UserRole.HR_OFFICER;
  const today = formatDateKey(new Date());
  const todayRecords = attendanceRecords.filter((record) => record.date === today);
  const myTodayRecord = todayRecords.find((record) => record.userId === currentUser.id);
  const pendingRequests = leaveRequests.filter((request) => request.status === LeaveStatus.PENDING);
  const myRequests = leaveRequests.filter((request) => request.userId === currentUser.id);
  const presentCount = todayRecords.filter((record) => record.status === AttendanceStatus.PRESENT).length;
  const leaveCount = todayRecords.filter((record) => record.status === AttendanceStatus.LEAVE).length;
  const attendanceRate = Math.round((presentCount / Math.max(employees.length, 1)) * 100);
  const totalPayroll = employees.reduce((sum, employee) => sum + employee.monthlyWage, 0);
  const averageHours = todayRecords.length
    ? todayRecords.reduce((sum, record) => sum + record.workHours, 0) / todayRecords.length
    : 0;

  const availablePaidLeave = useMemo(() => {
    const balance = leaveBalances.find((item) => item.leaveTypeName === 'Paid Time Off');
    if (!balance) return 0;
    return Math.max(0, balance.allocatedDays - balance.usedDays);
  }, [leaveBalances]);

  const trend = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        const dateKey = formatDateKey(date);
        const records = attendanceRecords.filter((record) => {
          if (record.date !== dateKey) return false;
          return isManager || record.userId === currentUser.id;
        });
        const present = records.filter((record) => record.status === AttendanceStatus.PRESENT).length;
        const total = isManager ? Math.max(employees.length, 1) : 1;
        return {
          date: dateKey,
          label: date.toLocaleDateString(undefined, { weekday: 'short' }),
          present,
          percent: Math.min(100, Math.round((present / total) * 100)),
        };
      }),
    [attendanceRecords, currentUser.id, employees.length, isManager],
  );

  const teamPulse = useMemo(
    () =>
      employees.map((employee) => {
        const latestRecord = attendanceRecords
          .filter((record) => record.userId === employee.id)
          .sort((a, b) => b.date.localeCompare(a.date))[0];

        return {
          employee,
          latestRecord,
        };
      }),
    [attendanceRecords, employees],
  );

  const metrics = isManager
    ? [
        {
          label: 'Workforce',
          value: employees.length.toString(),
          detail: 'active people',
          action: () => navigate('/app/employees'),
        },
        {
          label: 'Attendance',
          value: `${attendanceRate}%`,
          detail: `${presentCount} checked in today`,
          action: () => navigate('/app/attendance'),
        },
        {
          label: 'Approvals',
          value: pendingRequests.length.toString(),
          detail: 'leave requests waiting',
          action: () => navigate('/app/time-off'),
        },
        {
          label: 'Payroll',
          value: `INR ${Math.round(totalPayroll / 1000)}K`,
          detail: 'monthly wage run',
          action: () => navigate('/app/profile'),
        },
      ]
    : [
        {
          label: 'Today',
          value: formatStatus(myTodayRecord?.status ?? (isCheckedIn ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT)),
          detail: myTodayRecord?.checkInAt ? `since ${myTodayRecord.checkInAt}` : 'no check-in yet',
          action: () => navigate('/app/attendance'),
        },
        {
          label: 'Paid Leave',
          value: availablePaidLeave.toString(),
          detail: 'days available',
          action: () => navigate('/app/time-off'),
        },
        {
          label: 'Requests',
          value: myRequests.filter((request) => request.status === LeaveStatus.PENDING).length.toString(),
          detail: 'pending decisions',
          action: () => navigate('/app/time-off'),
        },
        {
          label: 'Salary',
          value: `INR ${Math.round(currentUser.monthlyWage / 1000)}K`,
          detail: 'monthly wage',
          action: () => navigate('/app/profile'),
        },
      ];

  return (
    <div className="space-y-lg-sp">
      <section className="overflow-hidden rounded-lg border border-hairline-soft bg-canvas">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="p-lg-sp md:p-xxl">
            <div className="mb-xl flex flex-wrap items-center gap-xs">
              <span className="rounded-full bg-ink-deep px-base py-xxs text-caption-bold text-canvas">
                {currentRole}
              </span>
              <span className="rounded-full border border-hairline-soft px-base py-xxs text-caption-bold text-steel">
                {today}
              </span>
            </div>

            <h1 className="max-w-[820px] text-heading-lg font-semibold text-ink-deep">
              {isManager
                ? 'One cockpit for people, time, leave, and payroll.'
                : `Your workday is ready, ${currentUser.firstName}.`}
            </h1>
            <p className="mt-xs max-w-[760px] text-body-md text-steel">
              {isManager
                ? 'Live workforce health, exceptions, and approval actions are all wired into the demo data.'
                : 'Check in, review attendance, submit leave, and view salary details from one place.'}
            </p>

            <div className="mt-xl flex flex-wrap gap-xs">
              <button
                type="button"
                onClick={toggleCheckIn}
                className={[
                  'rounded-full px-xl py-md text-button-md transition-colors',
                  isCheckedIn
                    ? 'bg-critical text-on-primary hover:bg-critical-strong'
                    : 'bg-primary text-on-primary hover:bg-primary-deep',
                ].join(' ')}
              >
                {isCheckedIn ? 'Check out' : 'Check in now'}
              </button>
              <button
                type="button"
                onClick={() => navigate(isManager ? '/app/employees' : '/app/time-off')}
                className="rounded-full border border-ink-deep px-xl py-md text-button-md text-ink-deep transition-colors hover:bg-ink-deep hover:text-canvas"
              >
                {isManager ? 'Open directory' : 'Request time off'}
              </button>
              {!isManager && (
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-hairline px-xl py-md text-button-md text-steel transition-colors hover:border-critical hover:text-critical"
                >
                  Log out
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-hairline-soft bg-surface-soft p-lg-sp lg:border-l lg:border-t-0 md:p-xxl">
            <p className="text-caption-bold text-stone">Live operations</p>
            <div className="mt-lg-sp grid grid-cols-2 gap-xs">
              <MiniStat label="Present" value={presentCount} />
              <MiniStat label="On leave" value={leaveCount} />
              <MiniStat label="Avg hours" value={averageHours.toFixed(1)} />
              <MiniStat label="Pending" value={pendingRequests.length} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-base md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <button
            key={metric.label}
            type="button"
            onClick={metric.action}
            className="rounded-lg border border-hairline-soft bg-canvas p-lg-sp text-left transition-all hover:-translate-y-0.5 hover:border-hairline hover:shadow-sticky-panel"
          >
            <p className="text-caption-bold text-stone">{metric.label}</p>
            <p className="mt-xs text-heading-sm font-semibold text-ink-deep">{metric.value}</p>
            <p className="mt-xxs text-body-sm text-steel">{metric.detail}</p>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-lg-sp xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-hairline-soft bg-canvas p-lg-sp md:p-xl">
          <div className="flex flex-col justify-between gap-base md:flex-row md:items-center">
            <div>
              <p className="text-caption-bold text-stone">Attendance signal</p>
              <h2 className="text-heading-sm font-semibold text-ink-deep">
                {isManager ? 'Seven-day team presence' : 'Your seven-day presence'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/attendance')}
              className="self-start rounded-full border border-hairline px-base py-xs text-body-sm-bold text-ink transition-colors hover:border-ink-deep"
            >
              Attendance
            </button>
          </div>

          <div className="mt-xl flex h-[210px] items-end gap-xs">
            {trend.map((day) => (
              <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-xs">
                <div className="flex h-[150px] w-full items-end rounded-md bg-surface-soft p-xxs">
                  <div
                    className="w-full rounded-sm bg-primary transition-all"
                    style={{ height: `${Math.max(day.percent, day.present > 0 ? 12 : 3)}%` }}
                    title={`${day.percent}% present on ${day.date}`}
                  />
                </div>
                <span className="text-caption-bold text-ink-deep">{day.label}</span>
                <span className="text-caption text-steel">{day.percent}%</span>
              </div>
            ))}
          </div>

          <div className="mt-xl overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-body-sm">
              <thead>
                <tr className="border-b border-hairline-soft text-steel">
                  <th className="pb-sm font-semibold">Person</th>
                  <th className="pb-sm font-semibold">Team</th>
                  <th className="pb-sm font-semibold">Latest</th>
                  <th className="pb-sm font-semibold text-right">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {(isManager ? teamPulse : teamPulse.filter((row) => row.employee.id === currentUser.id)).map(
                  ({ employee, latestRecord }) => (
                    <tr key={employee.id} className="hover:bg-surface-soft/60">
                      <td className="py-sm">
                        <div className="flex items-center gap-xs">
                          <img
                            src={employee.avatarUrl}
                            alt={`${employee.firstName} ${employee.lastName}`}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-body-sm-bold text-ink-deep">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="text-caption text-steel">{employee.loginId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-sm text-steel">{employee.department}</td>
                      <td className="py-sm">
                        <span
                          className={[
                            'inline-flex rounded-full border px-sm-sp py-xxs text-caption-bold',
                            attendanceTone(latestRecord?.status),
                          ].join(' ')}
                        >
                          {formatStatus(latestRecord?.status ?? AttendanceStatus.ABSENT)}
                        </span>
                      </td>
                      <td className="py-sm text-right font-semibold text-ink-deep">
                        {latestRecord ? latestRecord.workHours.toFixed(1) : '0.0'}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-lg-sp">
          <div className="rounded-lg border border-hairline-soft bg-canvas p-lg-sp md:p-xl">
            <div className="flex items-start justify-between gap-base">
              <div>
                <p className="text-caption-bold text-stone">
                  {isManager ? 'Approval queue' : 'Recent activity'}
                </p>
                <h2 className="text-heading-sm font-semibold text-ink-deep">
                  {isManager ? `${pendingRequests.length} requests need action` : 'Leave status'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/app/time-off')}
                className="rounded-full border border-hairline px-base py-xs text-body-sm-bold text-ink transition-colors hover:border-ink-deep"
              >
                Time Off
              </button>
            </div>

            <div className="mt-lg-sp divide-y divide-hairline-soft">
              {(isManager ? pendingRequests : myRequests).slice(0, 4).map((request) => (
                <div key={request.id} className="py-base">
                  <div className="flex items-start justify-between gap-base">
                    <div>
                      <p className="text-body-sm-bold text-ink-deep">{request.userName}</p>
                      <p className="text-caption text-steel">
                        {request.leaveTypeName} - {request.startDate} to {request.endDate}
                      </p>
                    </div>
                    <span
                      className={[
                        'rounded-full border px-sm-sp py-xxs text-caption-bold',
                        leaveTone(request.status),
                      ].join(' ')}
                    >
                      {formatStatus(request.status)}
                    </span>
                  </div>
                  {isManager && request.status === LeaveStatus.PENDING && (
                    <div className="mt-sm-sp flex gap-xs">
                      <button
                        type="button"
                        onClick={() => approveLeaveRequest(request.id, 'Approved from dashboard.')}
                        className="rounded-full bg-success px-base py-xs text-caption-bold text-canvas"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectLeaveRequest(request.id, 'Rejected from dashboard.')}
                        className="rounded-full border border-critical px-base py-xs text-caption-bold text-critical"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {(isManager ? pendingRequests : myRequests).length === 0 && (
                <div className="rounded-lg bg-surface-soft p-base text-body-sm text-steel">
                  No leave activity to review.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-hairline-soft bg-ink-deep p-lg-sp text-canvas md:p-xl">
            <p className="text-caption-bold text-stone">Demo path</p>
            <h2 className="mt-xs text-heading-sm font-semibold">
              {isManager ? 'A judge can test the full HR loop.' : 'Employee self-service is one click away.'}
            </h2>
            <div className="mt-lg-sp grid grid-cols-1 gap-xs sm:grid-cols-2">
              <QuickPath label="Add employee" enabled={isManager} onClick={() => navigate('/app/employees')} />
              <QuickPath label="Review leave" enabled={isManager} onClick={() => navigate('/app/time-off')} />
              <QuickPath label="Check attendance" enabled onClick={() => navigate('/app/attendance')} />
              <QuickPath label="Salary info" enabled onClick={() => navigate('/app/profile')} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-hairline-soft bg-canvas p-base">
      <p className="text-caption-bold text-stone">{label}</p>
      <p className="mt-xs text-heading-sm font-semibold text-ink-deep">{value}</p>
    </div>
  );
}

function QuickPath({
  label,
  enabled,
  onClick,
}: {
  label: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className="rounded-lg border border-canvas/15 bg-canvas/10 px-base py-sm-sp text-left text-body-sm-bold text-canvas transition-colors hover:bg-canvas/20 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}
