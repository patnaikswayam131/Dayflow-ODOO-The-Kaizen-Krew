import { useState, useEffect } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export function AttendancePage() {
  useDocumentTitle('Attendance');
  const { user } = useAuth();
  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR_OFFICER';

  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/attendance?date=${dateFilter}`)
      .then((res: any) => {
        if (res.success) setRecords(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [dateFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-heading-lg text-ink-deep">Attendance</h1>
        <div className="flex items-center gap-sm">
          <label className="text-body-sm-bold text-ink-deep">Date:</label>
          <input 
            type="date" 
            className="input-field py-xs" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft">
              {isAdminOrHR && <th className="p-base text-body-sm-bold text-ink-deep">Employee</th>}
              <th className="p-base text-body-sm-bold text-ink-deep">Date</th>
              <th className="p-base text-body-sm-bold text-ink-deep">Check In</th>
              <th className="p-base text-body-sm-bold text-ink-deep">Check Out</th>
              <th className="p-base text-body-sm-bold text-ink-deep">Work Hours</th>
              <th className="p-base text-body-sm-bold text-ink-deep">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record.id} className="border-b border-hairline hover:bg-surface-soft/50">
                {isAdminOrHR && <td className="p-base text-body-sm text-ink-deep font-medium">{record.user?.first_name} {record.user?.last_name}</td>}
                <td className="p-base text-body-sm text-ink">{new Date(record.date).toLocaleDateString()}</td>
                <td className="p-base text-body-sm text-ink">
                  {record.check_in_at ? new Date(record.check_in_at).toLocaleTimeString() : '-'}
                </td>
                <td className="p-base text-body-sm text-ink">
                  {record.check_out_at ? new Date(record.check_out_at).toLocaleTimeString() : '-'}
                </td>
                <td className="p-base text-body-sm text-ink">
                  {record.work_hours ? record.work_hours.toFixed(2) : '0.00'}h
                </td>
                <td className="p-base text-body-sm">
                  <span className={`px-xxs py-[2px] rounded-sm text-caption-bold ${
                    record.status === 'PRESENT' ? 'bg-success/20 text-success' :
                    record.status === 'ABSENT' ? 'bg-danger/20 text-danger' :
                    'bg-warning/20 text-warning'
                  }`}>
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && !loading && (
          <div className="p-xl-sp text-center text-steel">No attendance records found for this date.</div>
        )}
        {loading && (
          <div className="p-xl-sp text-center text-steel">Loading...</div>
        )}
      </div>
    </div>
  );
}
