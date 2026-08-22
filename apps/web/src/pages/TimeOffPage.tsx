import { useState, useEffect } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export function TimeOffPage() {
  useDocumentTitle('Time Off');
  const { user } = useAuth();
  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR_OFFICER';

  const [requests, setRequests] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newReq, setNewReq] = useState({ type: 'Paid Time Off', start: '', end: '', remarks: '' });

  const fetchRequests = () => {
    setLoading(true);
    api.get('/leave').then((res: any) => {
      if (res.success) setRequests(res.data);
      setLoading(false);
    }).catch(console.error);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReq.start || !newReq.end) return;
    
    const start = new Date(newReq.start);
    const end = new Date(newReq.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    try {
      const res = await api.post('/leave', {
        type: newReq.type,
        startDate: newReq.start,
        endDate: newReq.end,
        days: diffDays,
        remarks: newReq.remarks
      });
      if (res.success) {
        setIsModalOpen(false);
        setNewReq({ type: 'Paid Time Off', start: '', end: '', remarks: '' });
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const approveRequest = async (id: string) => {
    try {
      const res = await api.post(`/leave/${id}/status`, { status: 'APPROVED' }, { method: 'PATCH' });
      if (res.success) {
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-heading-lg text-ink-deep">Time Off Requests</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          New Request
        </button>
      </div>

      <div className="card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft">
              {isAdminOrHR && <th className="p-base text-body-sm-bold text-ink-deep">Employee</th>}
              <th className="p-base text-body-sm-bold text-ink-deep">Type</th>
              <th className="p-base text-body-sm-bold text-ink-deep">Dates</th>
              <th className="p-base text-body-sm-bold text-ink-deep">Days</th>
              <th className="p-base text-body-sm-bold text-ink-deep">Status</th>
              {isAdminOrHR && <th className="p-base text-body-sm-bold text-ink-deep">Action</th>}
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} className="border-b border-hairline hover:bg-surface-soft/50">
                {isAdminOrHR && <td className="p-base text-body-sm text-ink-deep">{req.user?.first_name} {req.user?.last_name}</td>}
                <td className="p-base text-body-sm text-ink">{req.leave_type?.name}</td>
                <td className="p-base text-body-sm text-ink">
                  {new Date(req.start_date).toLocaleDateString()} to {new Date(req.end_date).toLocaleDateString()}
                </td>
                <td className="p-base text-body-sm text-ink">{req.days_requested}</td>
                <td className="p-base text-body-sm">
                  <span className={`px-xxs py-[2px] rounded-sm text-caption-bold ${
                    req.status === 'APPROVED' ? 'bg-success/20 text-success' :
                    req.status === 'REJECTED' ? 'bg-danger/20 text-danger' :
                    'bg-warning/20 text-warning'
                  }`}>
                    {req.status}
                  </span>
                </td>
                {isAdminOrHR && (
                  <td className="p-base">
                    {req.status === 'PENDING' && (
                      <button className="text-brand text-body-sm-bold hover:underline" onClick={() => approveRequest(req.id)}>
                        Approve
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && !loading && (
          <div className="p-xl-sp text-center text-steel">No leave requests found.</div>
        )}
        {loading && (
          <div className="p-xl-sp text-center text-steel">Loading...</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-deep/50 p-base">
          <div className="bg-canvas rounded-lg shadow-sticky-panel p-xl-sp w-full max-w-md">
            <h2 className="text-heading-md text-ink-deep mb-base">Request Time Off</h2>
            <form onSubmit={handleSubmit} className="space-y-base">
              <div>
                <label className="block text-body-sm-bold text-ink-deep mb-xxs">Leave Type</label>
                <select 
                  className="input-field w-full" 
                  value={newReq.type}
                  onChange={e => setNewReq({...newReq, type: e.target.value})}
                >
                  <option>Paid Time Off</option>
                  <option>Sick Leave</option>
                  <option>Unpaid Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="block text-body-sm-bold text-ink-deep mb-xxs">Start Date</label>
                  <input 
                    type="date" 
                    required 
                    className="input-field w-full"
                    value={newReq.start}
                    onChange={e => setNewReq({...newReq, start: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-body-sm-bold text-ink-deep mb-xxs">End Date</label>
                  <input 
                    type="date" 
                    required 
                    className="input-field w-full"
                    value={newReq.end}
                    onChange={e => setNewReq({...newReq, end: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-body-sm-bold text-ink-deep mb-xxs">Remarks</label>
                <textarea 
                  className="input-field w-full h-24 resize-none"
                  value={newReq.remarks}
                  onChange={e => setNewReq({...newReq, remarks: e.target.value})}
                  placeholder="Optional note to your manager..."
                ></textarea>
              </div>
              <div className="flex justify-end gap-sm mt-xl-sp">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
