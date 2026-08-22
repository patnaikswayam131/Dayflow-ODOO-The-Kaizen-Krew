import { useMemo, useState, type FormEvent } from 'react';
import { LeaveStatus, UserRole } from '@dayflow/shared';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const formatStatus = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const statusTone = (status: LeaveStatus) => {
  if (status === LeaveStatus.APPROVED) return 'border-success/30 bg-success/10 text-success';
  if (status === LeaveStatus.PENDING) return 'border-warning/40 bg-warning/10 text-ink-deep';
  return 'border-critical/30 bg-critical/10 text-critical';
};

export function TimeOffPage() {
  useDocumentTitle('Time Off');
  const {
    currentUser,
    currentRole,
    leaveBalances,
    leaveRequests,
    submitLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
  } = useAuth();

  const isManager = currentRole === UserRole.ADMIN || currentRole === UserRole.HR_OFFICER;
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [leaveTypeName, setLeaveTypeName] = useState('Paid Time Off');
  const [startDate, setStartDate] = useState('2026-09-10');
  const [endDate, setEndDate] = useState('2026-09-12');
  const [remarks, setRemarks] = useState('');
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pendingRequests = useMemo(
    () => leaveRequests.filter((request) => request.status === LeaveStatus.PENDING),
    [leaveRequests],
  );
  const myRequests = useMemo(
    () => leaveRequests.filter((request) => request.userId === currentUser.id),
    [currentUser.id, leaveRequests],
  );
  const visibleHistory = isManager ? leaveRequests : myRequests;

  const totals = useMemo(
    () => ({
      pending: visibleHistory.filter((request) => request.status === LeaveStatus.PENDING).length,
      approved: visibleHistory.filter((request) => request.status === LeaveStatus.APPROVED).length,
      rejected: visibleHistory.filter((request) => request.status === LeaveStatus.REJECTED).length,
      days: visibleHistory.reduce((sum, request) => sum + request.daysRequested, 0),
    }),
    [visibleHistory],
  );

  const handleSubmitRequest = (event: FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    if (new Date(endDate) < new Date(startDate)) {
      setErrorMsg('End date cannot be earlier than start date.');
      return;
    }

    submitLeaveRequest({
      leaveTypeName,
      startDate,
      endDate,
      remarks,
    });

    setShowRequestModal(false);
    setRemarks('');
  };

  const handleReview = (requestId: string, decision: 'approve' | 'reject') => {
    const comment = reviewComments[requestId]?.trim();
    if (decision === 'approve') {
      approveLeaveRequest(requestId, comment || 'Approved by HR/Admin.');
    } else {
      rejectLeaveRequest(requestId, comment || 'Rejected by HR/Admin.');
    }
    setReviewComments((prev) => ({ ...prev, [requestId]: '' }));
  };

  return (
    <div className="space-y-lg-sp">
      <section className="rounded-lg border border-hairline-soft bg-canvas p-lg-sp md:p-xxl">
        <div className="flex flex-col gap-lg-sp xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-caption-bold text-stone">Leave and time off</p>
            <h1 className="mt-xxs text-heading-lg font-semibold text-ink-deep">
              Time-off workflow board
            </h1>
            <p className="mt-xs max-w-[760px] text-body-md text-steel">
              Submit leave, monitor balances, and process approvals with immediate status updates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRequestModal(true)}
            className="rounded-full bg-primary px-xl py-md text-button-md text-canvas transition-colors hover:bg-primary-deep"
          >
            Request time off
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-base md:grid-cols-4">
        <SummaryTile label="Pending" value={totals.pending} detail="awaiting review" />
        <SummaryTile label="Approved" value={totals.approved} detail="completed requests" />
        <SummaryTile label="Rejected" value={totals.rejected} detail="declined requests" />
        <SummaryTile label="Days requested" value={totals.days} detail="in visible history" />
      </section>

      <section className="grid grid-cols-1 gap-base lg:grid-cols-3">
        {leaveBalances.map((balance) => {
          const isUnlimited = balance.allocatedDays >= 999;
          const available = isUnlimited
            ? 'Flexible'
            : Math.max(0, balance.allocatedDays - balance.usedDays).toString();
          const usedPercent = isUnlimited
            ? 0
            : Math.min(100, Math.round((balance.usedDays / Math.max(balance.allocatedDays, 1)) * 100));

          return (
            <div key={balance.leaveTypeName} className="rounded-lg border border-hairline-soft bg-canvas p-lg-sp">
              <div className="flex items-start justify-between gap-base">
                <div>
                  <p className="text-caption-bold text-stone">Balance</p>
                  <h2 className="mt-xxs text-subtitle-lg text-ink-deep">{balance.leaveTypeName}</h2>
                </div>
                <span className="rounded-full bg-surface-soft px-sm-sp py-xxs text-caption-bold text-steel">
                  2026
                </span>
              </div>
              <p className="mt-lg-sp text-heading-sm font-semibold text-ink-deep">{available}</p>
              <p className="text-body-sm text-steel">days available</p>
              <div className="mt-base h-2 rounded-full bg-surface-soft">
                <div className="h-full rounded-full bg-primary" style={{ width: `${usedPercent}%` }} />
              </div>
              <p className="mt-xs text-caption text-steel">
                Used {balance.usedDays} of {isUnlimited ? 'unlimited' : balance.allocatedDays}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-lg-sp xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 rounded-lg border border-hairline-soft bg-canvas p-lg-sp">
          <div className="flex flex-col justify-between gap-base md:flex-row md:items-center">
            <div>
              <p className="text-caption-bold text-stone">
                {isManager ? 'Approval queue' : 'My requests'}
              </p>
              <h2 className="text-heading-sm font-semibold text-ink-deep">
                {isManager ? `${pendingRequests.length} pending decisions` : 'Current leave activity'}
              </h2>
            </div>
          </div>

          <div className="mt-lg-sp space-y-base">
            {(isManager ? pendingRequests : myRequests).map((request) => (
              <article key={request.id} className="rounded-lg border border-hairline-soft bg-surface-soft p-base">
                <div className="flex flex-col justify-between gap-base md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-xs">
                      <p className="text-body-md-bold text-ink-deep">{request.userName}</p>
                      <span className="rounded-full bg-canvas px-sm-sp py-xxs text-caption-bold text-steel">
                        {request.leaveTypeName}
                      </span>
                      <span className="text-caption-bold text-primary">{request.daysRequested} days</span>
                    </div>
                    <p className="mt-xs text-body-sm text-steel">
                      {request.startDate} to {request.endDate}
                    </p>
                    <p className="mt-xxs text-body-sm text-ink">{request.remarks || 'No remarks added.'}</p>
                  </div>
                  <span
                    className={[
                      'self-start rounded-full border px-sm-sp py-xxs text-caption-bold',
                      statusTone(request.status),
                    ].join(' ')}
                  >
                    {formatStatus(request.status)}
                  </span>
                </div>

                {isManager && request.status === LeaveStatus.PENDING && (
                  <div className="mt-base grid grid-cols-1 gap-xs lg:grid-cols-[1fr_auto_auto]">
                    <input
                      type="text"
                      value={reviewComments[request.id] ?? ''}
                      onChange={(event) =>
                        setReviewComments((prev) => ({ ...prev, [request.id]: event.target.value }))
                      }
                      placeholder="Review comment"
                      className="min-h-10 rounded-full border border-hairline bg-canvas px-base text-body-sm text-ink outline-none focus:border-fb-blue"
                    />
                    <button
                      type="button"
                      onClick={() => handleReview(request.id, 'approve')}
                      className="rounded-full bg-success px-base py-xs text-body-sm-bold text-canvas"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReview(request.id, 'reject')}
                      className="rounded-full border border-critical bg-canvas px-base py-xs text-body-sm-bold text-critical"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </article>
            ))}

            {(isManager ? pendingRequests : myRequests).length === 0 && (
              <div className="rounded-lg bg-surface-soft p-xl text-center">
                <p className="text-body-md-bold text-ink-deep">No active requests</p>
                <p className="mt-xxs text-body-sm text-steel">New leave requests will appear here.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-hairline-soft bg-ink-deep p-lg-sp text-canvas xl:sticky xl:top-[96px] xl:self-start">
          <p className="text-caption-bold text-stone">Policy snapshot</p>
          <h2 className="mt-xxs text-heading-sm font-semibold">Leave rules in this demo</h2>
          <div className="mt-lg-sp space-y-xs">
            <PolicyRow label="Paid time off" value="24 days" />
            <PolicyRow label="Sick leave" value="7 days" />
            <PolicyRow label="Unpaid leave" value="Flexible" />
            <PolicyRow label="Approval" value={isManager ? 'You can review' : 'HR/Admin reviews'} />
          </div>
          <button
            type="button"
            onClick={() => setShowRequestModal(true)}
            className="mt-lg-sp w-full rounded-full bg-canvas px-xl py-md text-button-md text-ink-deep"
          >
            New request
          </button>
        </aside>
      </section>

      <section className="rounded-lg border border-hairline-soft bg-canvas p-lg-sp">
        <div className="flex flex-col justify-between gap-base md:flex-row md:items-center">
          <div>
            <p className="text-caption-bold text-stone">History</p>
            <h2 className="text-heading-sm font-semibold text-ink-deep">
              {isManager ? 'All leave requests' : 'My leave requests'}
            </h2>
          </div>
          <p className="text-body-sm text-steel">{visibleHistory.length} records</p>
        </div>

        <div className="mt-lg-sp overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-body-sm">
            <thead>
              <tr className="border-b border-hairline-soft text-steel">
                <th className="pb-sm font-semibold">Applicant</th>
                <th className="pb-sm font-semibold">Type</th>
                <th className="pb-sm font-semibold">Dates</th>
                <th className="pb-sm font-semibold">Days</th>
                <th className="pb-sm font-semibold">Review</th>
                <th className="pb-sm font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {visibleHistory.map((request) => (
                <tr key={request.id} className="hover:bg-surface-soft">
                  <td className="py-sm font-semibold text-ink-deep">{request.userName}</td>
                  <td className="py-sm text-steel">{request.leaveTypeName}</td>
                  <td className="py-sm font-mono text-caption text-ink">
                    {request.startDate} - {request.endDate}
                  </td>
                  <td className="py-sm text-ink">{request.daysRequested}</td>
                  <td className="py-sm text-steel">{request.reviewComment || '-'}</td>
                  <td className="py-sm text-right">
                    <span
                      className={[
                        'inline-flex rounded-full border px-sm-sp py-xxs text-caption-bold',
                        statusTone(request.status),
                      ].join(' ')}
                    >
                      {formatStatus(request.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-deep/60 p-base backdrop-blur-sm">
          <div className="w-full max-w-[540px] rounded-lg border border-hairline-soft bg-canvas p-lg-sp shadow-sticky-panel md:p-xxl">
            <div className="flex items-start justify-between gap-base border-b border-hairline-soft pb-base">
              <div>
                <p className="text-caption-bold text-stone">Self-service</p>
                <h2 className="text-heading-sm font-semibold text-ink-deep">Submit leave request</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="rounded-full border border-hairline px-sm-sp py-xxs text-caption-bold text-steel"
                aria-label="Close"
              >
                X
              </button>
            </div>

            {errorMsg && (
              <div className="mt-base rounded-lg border border-critical-strong bg-critical/10 p-base text-body-sm text-critical">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="mt-lg-sp space-y-base">
              <label className="block">
                <span className="mb-xs block text-body-sm-bold text-ink">Leave type</span>
                <select
                  value={leaveTypeName}
                  onChange={(event) => setLeaveTypeName(event.target.value)}
                  className="input"
                >
                  <option value="Paid Time Off">Paid Time Off</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </label>

              <div className="grid grid-cols-1 gap-base md:grid-cols-2">
                <label className="block">
                  <span className="mb-xs block text-body-sm-bold text-ink">Start date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="input"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-xs block text-body-sm-bold text-ink">End date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="input"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-xs block text-body-sm-bold text-ink">Remarks</span>
                <textarea
                  rows={4}
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  className="w-full rounded-lg border border-hairline bg-canvas p-md text-body-md text-ink outline-none focus:border-fb-blue"
                  required
                />
              </label>

              <div className="flex justify-end gap-xs border-t border-hairline-soft pt-base">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="rounded-full border border-hairline px-xl py-md text-button-md text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-xl py-md text-button-md text-canvas hover:bg-primary-deep"
                >
                  Submit request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-hairline-soft bg-canvas p-base">
      <p className="text-caption-bold text-stone">{label}</p>
      <p className="mt-xs text-heading-sm font-semibold text-ink-deep">{value}</p>
      <p className="mt-xxs text-body-sm text-steel">{detail}</p>
    </div>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-base rounded-lg bg-canvas/10 px-base py-xs">
      <span className="text-caption-bold text-hairline-soft">{label}</span>
      <span className="text-body-sm-bold text-canvas">{value}</span>
    </div>
  );
}
