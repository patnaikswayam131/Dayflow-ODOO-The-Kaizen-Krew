import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, type UserProfile } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const getCompanyCode = (companyName: string) => {
  const words = companyName.trim().split(/\s+/).filter(Boolean);
  const fromWords =
    words.length >= 2
      ? words.map((word) => word.charAt(0)).join('')
      : companyName.replace(/[^a-z]/gi, '').slice(0, 2);
  return (fromWords || 'DF').slice(0, 2).toUpperCase().padEnd(2, 'X');
};

const getNameCode = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = (parts[0] || 'NA').replace(/[^a-z]/gi, '').slice(0, 2);
  const last = (parts.slice(1).join('') || 'US').replace(/[^a-z]/gi, '').slice(0, 2);
  return `${first}${last}`.toUpperCase().padEnd(4, 'X');
};

const previewLoginId = (companyName: string, fullName: string) =>
  `${getCompanyCode(companyName)}${getNameCode(fullName)}${new Date().getFullYear()}0004`;

export function SignUpPage() {
  useDocumentTitle('Sign Up');
  const navigate = useNavigate();
  const { registerCompanyAdmin } = useAuth();

  const [companyName, setCompanyName] = useState('Odoo India');
  const [fullName, setFullName] = useState('Jordan Doe');
  const [email, setEmail] = useState('jordan.doe@dayflow.com');
  const [phone, setPhone] = useState('+1 (555) 222-1100');
  const [password, setPassword] = useState('Password123!');
  const [confirmPassword, setConfirmPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoName, setLogoName] = useState('No logo selected');
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<UserProfile | null>(null);

  const generatedLoginId = useMemo(
    () => previewLoginId(companyName, fullName),
    [companyName, fullName],
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }

    const result = registerCompanyAdmin({
      companyName,
      fullName,
      email,
      phone,
      password,
    });
    setCreatedUser(result.user);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] px-base py-xxl text-ink">
      <main className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-[1180px] grid-cols-1 items-center gap-xxl lg:grid-cols-[520px_1fr]">
        <section className="rounded-sm border-2 border-ink/70 bg-canvas p-xxl">
          <div className="mx-auto mb-xxl flex h-12 w-[220px] items-center justify-center rounded-lg bg-surface-soft text-body-sm-bold text-ink">
            Dayflow HRMS
          </div>
          <h1 className="sr-only">Sign Up Page</h1>

          {createdUser ? (
            <div className="space-y-base text-center">
              <p className="text-caption-bold text-success">Account created</p>
              <h1 className="text-heading-sm font-semibold text-ink-deep">
                {createdUser.firstName} can sign in now.
              </h1>
              <div className="rounded-lg bg-surface-soft p-base text-left">
                <p className="text-caption text-stone">Generated Login ID</p>
                <p className="mt-xxs font-mono text-body-md-bold text-ink-deep">
                  {createdUser.loginId}
                </p>
                <p className="mt-xs text-caption text-steel">
                  Password is the one set during sign up.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/app/employees', { replace: true })}
                className="h-11 w-full rounded-md bg-[#d665ee] px-xl text-button-md text-canvas transition-colors hover:bg-[#bd4ad8]"
              >
                Open workspace
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-base">
              <div className="grid grid-cols-[1fr_auto] gap-xs">
                <label className="block">
                  <span className="mb-xs block text-body-sm-bold text-ink">Company Name</span>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    className="h-11 w-full rounded-md border-2 border-ink/60 bg-canvas px-base text-body-md text-ink outline-none focus:border-primary"
                    required
                  />
                </label>
                <label className="mt-[26px] flex h-11 w-11 cursor-pointer items-center justify-center rounded-md bg-primary text-body-md-bold text-canvas">
                  Up
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      setLogoName(event.target.files?.[0]?.name ?? 'No logo selected');
                    }}
                  />
                </label>
              </div>

              <Field label="Name">
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="h-11 w-full rounded-md border-2 border-ink/60 bg-canvas px-base text-body-md text-ink outline-none focus:border-primary"
                  required
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 w-full rounded-md border-2 border-ink/60 bg-canvas px-base text-body-md text-ink outline-none focus:border-primary"
                  required
                />
              </Field>

              <Field label="Phone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="h-11 w-full rounded-md border-2 border-ink/60 bg-canvas px-base text-body-md text-ink outline-none focus:border-primary"
                  required
                />
              </Field>

              <PasswordField
                label="Password"
                value={password}
                visible={showPassword}
                onToggle={() => setShowPassword((visible) => !visible)}
                onChange={setPassword}
              />

              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((visible) => !visible)}
                onChange={setConfirmPassword}
              />

              {error && (
                <div className="rounded-md border border-critical-strong bg-critical/10 px-base py-xs text-body-sm text-critical">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="h-11 w-full rounded-md bg-[#d665ee] px-xl text-button-md text-canvas transition-colors hover:bg-[#bd4ad8]"
              >
                Sign Up
              </button>
            </form>
          )}

          <p className="mt-base text-center text-caption text-ink">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-ink-deep hover:underline">
              Sign In
            </Link>
          </p>
        </section>

        <aside className="space-y-base">
          <div className="rounded-lg border border-hairline-soft bg-canvas p-xl">
            <p className="text-caption-bold text-stone">Upload logo</p>
            <p className="mt-xs text-body-sm text-steel">{logoName}</p>
          </div>

          <div className="rounded-lg border border-hairline-soft bg-canvas p-xl">
            <p className="text-caption-bold text-stone">Generated Login ID preview</p>
            <p className="mt-xs font-mono text-heading-sm font-semibold text-ink-deep">
              {generatedLoginId}
            </p>
            <p className="mt-base text-body-sm text-steel">
              Format: company code + first two letters of first and last name + joining year + serial number.
            </p>
          </div>

          <div className="rounded-lg border border-hairline-soft bg-[#fff9df] p-xl">
            <p className="text-body-sm-bold text-ink-deep">Note</p>
            <div className="mt-xs space-y-xs text-body-sm text-steel">
              <p>Normal employees cannot register themselves.</p>
              <p>HR/Admin creates employee accounts from the Employees page.</p>
              <p>Each employee receives a generated Login ID and first-time password.</p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-xs block text-body-sm-bold text-ink">{label}</span>
      {children}
    </label>
  );
}

function PasswordField({
  label,
  value,
  visible,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  visible: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-xs block text-body-sm-bold text-ink">{label}</span>
      <span className="flex h-11 rounded-md border-2 border-ink/60 bg-canvas focus-within:border-primary">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 rounded-md bg-transparent px-base text-body-md text-ink outline-none"
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="w-16 border-l border-hairline-soft text-caption-bold text-steel"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </span>
    </label>
  );
}
