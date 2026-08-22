import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../lib/api';

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();

  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR_OFFICER';

  return (
    <div>
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-heading-lg text-ink-deep">
          Welcome back, {user?.firstName}!
        </h1>
      </div>

      {isAdminOrHR ? <AdminDashboard /> : <EmployeeDashboard />}
    </div>
  );
}

function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    pendingApprovals: 0
  });

  useEffect(() => {
    api.get('/dashboard/metrics').then((res: any) => {
      if (res.success) setMetrics(res.data);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-xl-sp">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-base">
        <MetricCard title="Total Employees" value={metrics.totalEmployees.toString()} />
        <MetricCard title="Present Today" value={metrics.presentToday.toString()} />
        <MetricCard title="On Leave" value={metrics.onLeave.toString()} />
        <MetricCard title="Pending Approvals" value={metrics.pendingApprovals.toString()} highlight />
      </div>

      {/* Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl-sp">
        <DashboardCard
          title="Employees"
          description="View directory and manage records"
          link="/app/employees"
          actionText="Directory"
        />
        <DashboardCard
          title="Attendance"
          description="Track check-ins and work hours"
          link="/app/attendance"
          actionText="View Logs"
        />
        <DashboardCard
          title="Time Off"
          description="Manage leave requests and balances"
          link="/app/time-off"
          actionText="Leave Queue"
        />
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [loading, setLoading] = useState(true);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);

  useEffect(() => {
    // Fetch today's status
    api.get('/attendance/today').then((res: any) => {
      if (res.success && res.data && res.data.check_in_at && !res.data.check_out_at) {
        setIsCheckedIn(true);
        setCheckInTime(new Date(res.data.check_in_at));
      } else {
        setIsCheckedIn(false);
        setCheckInTime(null);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    // Fetch leave balances
    api.get('/dashboard/employee-metrics').then((res: any) => {
      if (res.success && res.data?.leaveBalances) {
        setLeaveBalances(res.data.leaveBalances);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!isCheckedIn || !checkInTime) {
      setElapsed('00:00:00');
      return;
    }
    const interval = setInterval(() => {
      const diff = Math.floor((new Date().getTime() - checkInTime.getTime()) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCheckedIn, checkInTime]);

  const toggleCheckIn = async () => {
    setLoading(true);
    try {
      if (!isCheckedIn) {
        const res = await api.post('/attendance/check-in', {});
        if (res.success) {
          setIsCheckedIn(true);
          setCheckInTime(new Date(res.data.check_in_at));
        }
      } else {
        const res = await api.post('/attendance/check-out', {});
        if (res.success) {
          setIsCheckedIn(false);
          setCheckInTime(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-xl-sp">
      {/* Action Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl-sp">
        <div className="card p-section flex flex-col items-center justify-center text-center relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isCheckedIn ? 'bg-success' : 'bg-danger'}`}></span>
            <span className="text-caption-bold text-stone">{isCheckedIn ? 'Present' : 'Not Checked In'}</span>
          </div>
          <h2 className="text-heading-sm text-ink-deep mb-xs">Today's Status</h2>
          <p className="text-body-sm text-stone mb-xs">{todayStr}</p>
          <div className="text-heading-lg text-ink-deep font-mono tracking-wider mb-base">
            {elapsed}
          </div>
          <button 
            className={`w-full max-w-[200px] ${isCheckedIn ? 'btn-secondary' : 'btn-primary'}`}
            onClick={toggleCheckIn}
            disabled={loading}
          >
            {loading ? 'Processing...' : isCheckedIn ? 'Check Out' : 'Check In'}
          </button>
        </div>
        <div className="card p-section">
          <h2 className="text-heading-sm text-ink-deep mb-base">Leave Balances</h2>
          <div className="space-y-sm">
            {leaveBalances.map((balance: any, index: number) => {
              const allocated = balance.allocated_days || 0;
              const used = balance.used_days || 0;
              const remaining = allocated - used;
              const percent = allocated > 0 ? (used / allocated) * 100 : 0;
              // Alternate colors for visually pleasing UI
              const barColor = index % 2 === 0 ? 'bg-brand' : 'bg-success';
              
              return (
                <div key={index} className="mb-sm">
                  <div className="flex justify-between items-center text-body-sm">
                    <span className="text-ink">{balance.leave_type?.name}</span>
                    <span className="text-ink-deep font-bold">{remaining} / {allocated} days</span>
                  </div>
                  <div className="w-full bg-surface-soft h-2 rounded-full overflow-hidden mt-xxs">
                    <div className={`${barColor} h-full`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
            
            {leaveBalances.length === 0 && (
              <div className="text-body-sm text-steel">No leave balances found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-base">
        <DashboardCard
          title="My Profile"
          description="View and update your info"
          link="/app/profile"
          actionText="View Profile"
        />
        <DashboardCard
          title="My Attendance"
          description="View your timesheet"
          link="/app/attendance"
          actionText="View History"
        />
        <DashboardCard
          title="My Time Off"
          description="Request leave and view status"
          link="/app/time-off"
          actionText="Request Leave"
        />
      </div>
    </div>
  );
}

function MetricCard({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <div className={`card p-base ${highlight ? 'border-brand/30 bg-brand/5' : ''}`}>
      <h3 className="text-body-sm text-steel mb-xxs">{title}</h3>
      <p className={`text-heading-lg ${highlight ? 'text-brand' : 'text-ink-deep'}`}>{value}</p>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  link,
  actionText,
}: {
  title: string;
  description: string;
  link: string;
  actionText: string;
}) {
  return (
    <a
      href={link}
      className="card p-section hover:shadow-sticky-panel transition-shadow duration-150 ease-out block flex flex-col h-full"
    >
      <h2 className="text-heading-sm text-ink-deep mb-xs">{title}</h2>
      <p className="text-body-sm text-steel mb-base flex-grow">{description}</p>
      <span className="text-body-sm-bold text-brand mt-auto">{actionText}</span>
    </a>
  );
}
