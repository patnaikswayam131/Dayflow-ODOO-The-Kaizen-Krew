import { useState } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { SalaryInfoTab } from '../components/SalaryInfoTab';
import { UserRole } from '@dayflow/shared';

export function ProfilePage() {
  useDocumentTitle('My Profile');

  const [activeTab, setActiveTab] = useState<'Resume' | 'Private Info' | 'Salary Info' | 'Security'>('Salary Info');

  // Placeholder role & userId - can be fetched from Auth context or params
  const currentUserRole = UserRole.ADMIN;
  const userId = 'current-user';

  return (
    <div className="space-y-xxl">
      {/* ── Single H1 for Security Checklist Part B #8–9 ── */}
      <div>
        <span className="text-caption-bold text-steel uppercase tracking-wider">
          User Account
        </span>
        <h1 className="text-heading-lg text-ink-deep font-semibold mt-xxs">
          My Profile
        </h1>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-xs border-b border-hairline-soft pb-xs overflow-x-auto">
        {(['Resume', 'Private Info', 'Salary Info', 'Security'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-base py-xs text-body-sm-bold rounded-full transition-colors duration-150 ease-out whitespace-nowrap
              ${
                activeTab === tab
                  ? 'bg-ink-deep text-canvas'
                  : 'bg-canvas text-ink border border-hairline hover:bg-surface-soft'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Salary Info' ? (
        <SalaryInfoTab
          userId={userId}
          currentUserRole={currentUserRole}
          isSelf={true}
          onSave={async (data) => {
            await fetch(`/api/v1/salary/users/${userId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
          }}
        />
      ) : (
        <div className="bg-canvas border border-hairline-soft rounded-xxl p-xxxl text-center space-y-sm">
          <p className="text-subtitle-lg text-ink-deep font-semibold">{activeTab} Section</p>
          <p className="text-body-sm text-steel">
            This tab profile content will be populated during profile integration ({activeTab}).
          </p>
        </div>
      )}
    </div>
  );
}
