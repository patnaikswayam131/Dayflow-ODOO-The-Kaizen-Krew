import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Login Page — Public route.
 * TODO (Dev 1 — feat/auth-foundation): Implement login form with
 * Login ID/Email + Password, generic error message on failure (FR-2),
 * and company bootstrap flow (FR-1).
 */
export function LoginPage() {
  useDocumentTitle('Sign In');

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-xxl">
      <div className="w-full max-w-[400px]">
        {/* Single H1 per page (Security Checklist Part B #8, #9) */}
        <h1 className="text-heading-lg text-ink-deep text-center mb-xxl">
          Welcome to Dayflow
        </h1>
        <p className="text-body-md text-steel text-center mb-xxl">
          Sign in to your account
        </p>
        <div className="card p-xxl">
          <p className="text-body-sm text-stone text-center">
            Login form will be implemented in{' '}
            <code className="text-body-sm-bold text-ink bg-surface-soft px-xxs py-[2px] rounded-sm">
              feat/auth-foundation
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
