import { useMemo, useState } from 'react';
import { AttendanceStatus, UserRole } from '@dayflow/shared';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type AttendanceViewMode = 'day' | 'week';
type StatusFilter = AttendanceStatus | 'ALL';

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const formatStatus = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getWeekRange = (dateString: string) => {
  const selected = new Date(`${dateString}T00:00:00`);
  const day = selected.getDay() || 7;
  const start = new Date(selected);
  start.setDate(selected.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: formatDate(start), end: formatDate(end) };
};

const statusTone = (status: AttendanceStatus) => {
  if (status === AttendanceStatus.PRESENT) return 'border-success/30 bg-success/10 text-success';
  if (status === AttendanceStatus.LEAVE) return 'border-primary/30 bg-primary/10 text-primary';
  if (status === AttendanceStatus.HALF_DAY) return 'border-warning/40 bg-warning/10 text-ink-deep';
  return 'border-critical/30 bg-critical/10 text-critical';
};

export function AttendancePage() {
  useDocumentTitle('Attendance');
  const {
    currentUser,
    currentRole,
    isCheckedIn,
    toggleCheckIn,
    attendanceRecords,
    employees,
  } = useAuth();

  const isManager = currentRole === UserRole.ADMIN || currentRole === UserRole.HR_OFFICER;
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [viewMode, setViewMode] = useState<AttendanceViewMode>('day');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const weekRange = useMemo(() => getWeekRange(selectedDate), [selectedDate]);

  const displayRecords = useMemo(
    () =>
      attendanceRecords
        .filter((record) => {
          const matchesEmployee = isManager
            ? selectedEmployeeId === 'all' || record.userId === selectedEmployeeId
            : record.userId === currentUser.id;
          const matchesDate =
            viewMode === 'day'
              ? record.date === selectedDate
              : record.date >= weekRange.start && record.date <= weekRange.end;
          const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
          return matchesEmployee && matchesDate && matchesStatus;
        })
        .sort((a, b) => `${b.date}-${b.userName}`.localeCompare(`${a.date}-${a.userName}`)),
    [
      attendanceRecords,
      currentUser.id,
      isManager,
      selectedDate,
      selectedEmployeeId,
      statusFilter,
      viewMode,
      weekRange.end,
      weekRange.start,
    ],
  );

  const summary = useMemo(
    () => ({
      present: displayRecords.filter((record) => record.status === AttendanceStatus.PRESENT).length,
      leave: displayRecords.filter((record) => record.status === AttendanceStatus.LEAVE).length,
      halfDay: displayRecords.filter((record) => record.status === AttendanceStatus.HALF_DAY).length,
      absent: displayRecords.filter((record) => record.status === AttendanceStatus.ABSENT).length,
      workHours: displayRecords.reduce((sum, record) => sum + record.workHours, 0),
      extraHours: displayRecords.reduce((sum, record) => sum + record.extraHours, 0),
    }),
    [displayRecords],
  );

  const weekDays = useMemo(() => {
    const start = new Date(`${weekRange.start}T00:00:00`);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const dateKey = formatDate(date);
      const dayRecords = attendanceRecords.filter((record) => {
        const matchesEmployee = isManager
          ? selectedEmployeeId === 'all' || record.userId === selectedEmployeeId
          : record.userId === currentUser.id;
        return record.date === dateKey && matchesEmployee;
      });
      const present = dayRecords.filter((record) => record.status === AttendanceStatus.PRESENT).length;
      const total = isManager ? Math.max(employees.length, 1) : 1;
      return {
        date: dateKey,
        label: date.toLocaleDateString(undefined, { weekday: 'short' }),
        present,
        total,
        percent: Math.round((present / total) * 100),
        hours: dayRecords.reduce((sum, record) => sum + record.workHours, 0),
      };
    });
  }, [attendanceRecords, currentUser.id, employees.length, isManager, selectedEmployeeId, weekRange.start]);

  const todayRecord = attendanceRecords.find(
    (record) => record.userId === currentUser.id && record.date === formatDate(new Date()),
  );

  return (
    <div className="space-y-lg-sp">
      <section className="rounded-lg border border-hairline-soft bg-canvas p-lg-sp md:p-xxl">
        <div className="flex flex-col gap-lg-sp xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-caption-bold text-stone">Time and attendance</p>
            <h1 className="mt-xxs text-heading-lg font-semibold text-ink-deep">
              Attendance control board
            </h1>
            <p className="mt-xs max-w-[760px] text-body-md text-steel">
              {isManager
                ? 'Review attendance by day or week, filter exceptions, and inspect work-hour coverage.'
                : 'Track your check-ins, weekly hours, and attendance status.'}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleCheckIn}
            className={[
              'rounded-full px-xl py-md text-button-md transition-colors',
              isCheckedIn
                ? 'bg-critical text-canvas hover:bg-critical-strong'
                : 'bg-primary text-canvas hover:bg-primary-deep',
            ].join(' ')}
          >
            {isCheckedIn ? 'Check out' : 'Check in now'}
          </button>
        </div>

        <div className="mt-xl grid grid-cols-1 gap-base xl:grid-cols-[1fr_auto_auto_auto] xl:items-center">
          <div className="flex flex-wrap gap-xs">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={[
                'rounded-full border px-base py-xs text-body-sm-bold',
                viewMode === 'day'
                  ? 'border-ink-deep bg-ink-deep text-canvas'
                  : 'border-hairline bg-canvas text-steel',
              ].join(' ')}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={[
                'rounded-full border px-base py-xs text-body-sm-bold',
                viewMode === 'week'
                  ? 'border-ink-deep bg-ink-deep text-canvas'
                  : 'border-hairline bg-canvas text-steel',
              ].join(' ')}
            >
              Weekly
            </button>
          </div>

          <label className="flex min-h-11 items-center gap-xs rounded-full border border-hairline-soft bg-surface-soft px-base">
            <span className="text-caption-bold text-stone">Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="bg-transparent text-body-sm-bold text-ink outline-none"
            />
          </label>

          {isManager && (
            <select
              value={selectedEmployeeId}
              onChange={(event) => setSelectedEmployeeId(event.target.value)}
              className="min-h-11 rounded-full border border-hairline-soft bg-surface-soft px-base text-body-sm-bold text-ink outline-none"
            >
              <option value="all">All employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="min-h-11 rounded-full border border-hairline-soft bg-surface-soft px-base text-body-sm-bold text-ink outline-none"
          >
            <option value="ALL">All statuses</option>
            <option value={AttendanceStatus.PRESENT}>Present</option>
            <option value={AttendanceStatus.ABSENT}>Absent</option>
            <option value={AttendanceStatus.HALF_DAY}>Half day</option>
            <option value={AttendanceStatus.LEAVE}>Leave</option>
          </select>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-base md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Present" value={summary.present} tone="text-success" />
        <SummaryCard label="Leave" value={summary.leave} tone="text-primary" />
        <SummaryCard label="Half day" value={summary.halfDay} tone="text-ink-deep" />
        <SummaryCard label="Absent" value={summary.absent} tone="text-critical" />
        <SummaryCard label="Hours" value={summary.workHours.toFixed(1)} tone="text-ink-deep" />
        <SummaryCard label="Extra" value={summary.extraHours.toFixed(1)} tone="text-primary" />
      </section>

      {viewMode === 'week' && (
        <section className="rounded-lg border border-hairline-soft bg-canvas p-lg-sp">
          <div className="flex flex-col justify-between gap-base md:flex-row md:items-center">
            <div>
              <p className="text-caption-bold text-stone">Weekly heatmap</p>
              <h2 className="text-heading-sm font-semibold text-ink-deep">
                {weekRange.start} to {weekRange.end}
              </h2>
            </div>
            <p className="text-body-sm text-steel">Presence is calculated against visible employees.</p>
          </div>
          <div className="mt-lg-sp grid grid-cols-2 gap-xs md:grid-cols-7">
            {weekDays.map((day) => (
              <div key={day.date} className="rounded-lg border border-hairline-soft bg-surface-soft p-base">
                <div className="flex items-center justify-between">
                  <p className="text-body-sm-bold text-ink-deep">{day.label}</p>
                  <p className="text-caption-bold text-steel">{day.percent}%</p>
                </div>
                <p className="mt-xxs text-caption text-steel">{day.date}</p>
                <div className="mt-base h-2 rounded-full bg-hairline-soft">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(day.percent, day.present > 0 ? 10 : 2)}%` }}
                  />
                </div>
                <p className="mt-xs text-caption text-steel">
                  {day.present}/{day.total} present - {day.hours.toFixed(1)} hrs
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-lg-sp xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-lg border border-hairline-soft bg-canvas p-lg-sp">
          <div className="flex flex-col justify-between gap-base md:flex-row md:items-center">
            <div>
              <p className="text-caption-bold text-stone">Audit log</p>
              <h2 className="text-heading-sm font-semibold text-ink-deep">
                {viewMode === 'day'
                  ? `Records for ${selectedDate}`
                  : `Records for ${weekRange.start} to ${weekRange.end}`}
              </h2>
            </div>
            <p className="text-body-sm text-steel">{displayRecords.length} records</p>
          </div>

          <div className="mt-lg-sp overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-body-sm">
              <thead>
                <tr className="border-b border-hairline-soft text-steel">
                  <th className="pb-sm font-semibold">Date</th>
                  <th className="pb-sm font-semibold">Employee</th>
                  <th className="pb-sm font-semibold">Check-in</th>
                  <th className="pb-sm font-semibold">Check-out</th>
                  <th className="pb-sm font-semibold text-right">Hours</th>
                  <th className="pb-sm font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {displayRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-surface-soft">
                    <td className="py-sm font-mono text-caption text-ink">{record.date}</td>
                    <td className="py-sm font-semibold text-ink-deep">{record.userName}</td>
                    <td className="py-sm text-steel">{record.checkInAt || '-'}</td>
                    <td className="py-sm text-steel">{record.checkOutAt || '-'}</td>
                    <td className="py-sm text-right text-ink-deep">
                      {record.workHours.toFixed(1)}
                      {record.extraHours > 0 ? ` +${record.extraHours.toFixed(1)}` : ''}
                    </td>
                    <td className="py-sm text-right">
                      <span
                        className={[
                          'inline-flex rounded-full border px-sm-sp py-xxs text-caption-bold',
                          statusTone(record.status),
                        ].join(' ')}
                      >
                        {formatStatus(record.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {displayRecords.length === 0 && (
            <div className="mt-base rounded-lg bg-surface-soft p-xl text-center">
              <p className="text-body-md-bold text-ink-deep">No attendance records found</p>
              <p className="mt-xxs text-body-sm text-steel">Change the date, employee, or status filter.</p>
            </div>
          )}
        </div>

        <aside className="rounded-lg border border-hairline-soft bg-canvas p-lg-sp xl:sticky xl:top-[96px] xl:self-start">
          <p className="text-caption-bold text-stone">My workday</p>
          <h2 className="mt-xxs text-heading-sm font-semibold text-ink-deep">
            {isCheckedIn ? 'Currently checked in' : 'Not checked in'}
          </h2>
          <div className="mt-lg-sp space-y-xs">
            <DetailRow label="Today status" value={formatStatus(todayRecord?.status ?? AttendanceStatus.ABSENT)} />
            <DetailRow label="Check-in" value={todayRecord?.checkInAt || '-'} />
            <DetailRow label="Check-out" value={todayRecord?.checkOutAt || '-'} />
            <DetailRow label="Hours" value={todayRecord ? todayRecord.workHours.toFixed(1) : '0.0'} />
          </div>
          <button
            type="button"
            onClick={toggleCheckIn}
            className={[
              'mt-lg-sp w-full rounded-full px-xl py-md text-button-md transition-colors',
              isCheckedIn
                ? 'bg-critical text-canvas hover:bg-critical-strong'
                : 'bg-primary text-canvas hover:bg-primary-deep',
            ].join(' ')}
          >
            {isCheckedIn ? 'Check out' : 'Check in'}
          </button>
        </aside>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-hairline-soft bg-canvas p-base">
      <p className="text-caption-bold text-stone">{label}</p>
      <p className={`mt-xs text-heading-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-base rounded-lg bg-surface-soft px-base py-xs">
      <span className="text-caption-bold text-stone">{label}</span>
      <span className="text-body-sm-bold text-ink-deep">{value}</span>
    </div>
  );
}
