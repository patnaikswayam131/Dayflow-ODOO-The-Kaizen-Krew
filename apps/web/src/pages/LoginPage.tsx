import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '@dayflow/shared';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function landingPathForRole(role: UserRole) {
  if (role === UserRole.EMPLOYEE) {
    return '/app/profile';
  }
  return '/app/employees';
}

export function LoginPage() {
  useDocumentTitle('Sign In');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('OIJODO20220001');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const user = login(identifier, password);
    if (!user) {
      setError('Invalid Login ID/email or password.');
      return;
    }

    navigate(landingPathForRole(user.role), { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] px-base py-xxl text-ink">
      <main className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-[1120px] grid-cols-1 items-center gap-xxl lg:grid-cols-[440px_1fr]">
        <section className="rounded-sm border-2 border-ink/70 bg-canvas p-xxl">
          <div className="mx-auto mb-xxl flex h-12 w-[220px] items-center justify-center rounded-lg bg-surface-soft text-body-sm-bold text-ink">
            Dayflow HRMS
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-lg-sp">
            <label className="block">
              <span className="mb-xs block text-body-sm-bold text-ink">Login ID / Email</span>
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="h-11 w-full rounded-md border-2 border-ink/60 bg-canvas px-base text-body-md text-ink outline-none focus:border-primary"
                required
              />
            </label>

            <label className="block">
              <span className="mb-xs block text-body-sm-bold text-ink">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-md border-2 border-ink/60 bg-canvas px-base text-body-md text-ink outline-none focus:border-primary"
                required
              />
            </label>

            {error && (
              <div className="rounded-md border border-critical-strong bg-critical/10 px-base py-xs text-body-sm text-critical">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="h-11 w-full rounded-md bg-[#d665ee] px-xl text-button-md text-canvas transition-colors hover:bg-[#bd4ad8]"
            >
              Sign In
            </button>
          </form>

          <p className="mt-base text-center text-caption text-ink">
            Do not have an account?{' '}
            <Link to="/signup" className="font-bold text-ink-deep hover:underline">
              Sign Up
            </Link>
          </p>
        </section>

        <aside className="space-y-base">
          <div className="rounded-lg border border-hairline-soft bg-canvas p-xl">
            <p className="text-caption-bold text-stone">Assigned role login</p>
            <h1 className="mt-xxs text-heading-sm font-semibold text-ink-deep">
              Users land only in the area allowed for their role.
            </h1>
            <div className="mt-base grid grid-cols-1 gap-xs md:grid-cols-3 lg:grid-cols-1">
              <CredentialRow label="Admin" loginId="OIJODO20220001" lands="Employees, settings, salary" />
              <CredentialRow label="HR Officer" loginId="OIJODO20220002" lands="Employees and approvals" />
              <CredentialRow label="Employee" loginId="OIJODO20220003" lands="Profile, attendance, time off" />
            </div>
            <p className="mt-base text-caption text-steel">
              Demo password for seeded accounts: Password123!
            </p>
          </div>

          <div className="rounded-lg border border-hairline-soft bg-[#fff9df] p-xl">
            <p className="text-body-sm-bold text-ink-deep">Login ID format</p>
            <p className="mt-xs text-body-sm text-steel">
              Company initials + first two letters of first and last name + year of joining + serial number.
            </p>
            <p className="mt-xs font-mono text-body-sm-bold text-ink">OIJODO20220001</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

function CredentialRow({
  label,
  loginId,
  lands,
}: {
  label: string;
  loginId: string;
  lands: string;
}) {
  return (
    <div className="rounded-md border border-hairline-soft bg-surface-soft p-base">
      <div className="flex items-center justify-between gap-base">
        <span className="text-body-sm-bold text-ink-deep">{label}</span>
        <span className="font-mono text-caption-bold text-primary">{loginId}</span>
      </div>
      <p className="mt-xxs text-caption text-steel">{lands}</p>
    </div>
  );
}
