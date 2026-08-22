import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Profile Page — "My Profile" (FR-11, FR-12–FR-17).
 * TODO (Dev 2 — feat/employee-profile): Implement:
 * - Tabbed layout: Resume | Private Info | Salary Info | Security
 * - Header fields always visible (FR-14)
 * - Edit permissions per role (FR-15)
 * - Security tab: change password (FR-17)
 */
export function ProfilePage() {
  useDocumentTitle('My Profile');

  return (
    <div>
      <h1 className="text-heading-lg text-ink-deep mb-xxl">My Profile</h1>

      {/* Tab navigation */}
      <div className="flex gap-xs mb-xxl border-b border-hairline-soft pb-xs">
        {['Resume', 'Private Info', 'Salary Info', 'Security'].map((tab) => (
          <button
            key={tab}
            className="px-base py-xs text-body-sm-bold rounded-full bg-canvas text-ink border border-hairline"
            disabled
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Placeholder content */}
      <div className="card p-section text-center">
        <p className="text-body-md text-steel mb-xs">Profile content will appear here</p>
        <p className="text-body-sm text-stone">
          Profile tabs will be implemented in{' '}
          <code className="bg-surface-soft px-xxs py-[2px] rounded-sm text-body-sm-bold text-ink">
            feat/employee-profile
          </code>
        </p>
      </div>
    </div>
  );
}
