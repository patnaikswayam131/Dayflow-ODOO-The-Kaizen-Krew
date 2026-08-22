import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function LoginPage() {
  useDocumentTitle('Sign In — Dayflow');
  const { isBootstrapped, login, bootstrapCompany, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to app
  if (user) {
    navigate('/app', { replace: true });
  }

  const [mode, setMode] = useState<'LOGIN' | 'BOOTSTRAP'>('LOGIN');

  // Sign In Form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bootstrap Form state
  const [companyName, setCompanyName] = useState('');
  const [loginPrefix, setLoginPrefix] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [bootstrapPassword, setBootstrapPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [verificationMsg, setVerificationMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      await login({ identifier, password });
      navigate('/app', { replace: true });
    } catch (err) {
      // FR-2: Generic error message on failure — never reveal which field was wrong
      setLoginError((err as Error).message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setBootstrapError(null);

    if (bootstrapPassword !== confirmPassword) {
      setBootstrapError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await bootstrapCompany({
        companyName,
        loginPrefix: loginPrefix.toUpperCase(),
        adminFirstName,
        adminLastName,
        adminEmail,
        adminPhone: adminPhone || undefined,
        password: bootstrapPassword,
        confirmPassword,
      });

      setVerificationMsg(res.verificationMessage);
    } catch (err) {
      setBootstrapError((err as Error).message || 'Bootstrap failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-xxl">
      <div className="w-full max-w-[440px]">
        {/* Header */}
        <div className="text-center mb-xxl">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-ink-deep rounded-2xl mb-md">
            <span className="text-white text-heading-md font-bold">D</span>
          </div>
          <h1 className="text-heading-lg text-ink-deep font-semibold">Dayflow</h1>
          <p className="text-body-md text-steel mt-xxs">
            {mode === 'BOOTSTRAP'
              ? 'One-Time Company Setup'
              : 'Sign in to access your HR workspace'}
          </p>
        </div>

        {/* Card Container */}
        <div className="card p-xxl shadow-sticky-panel">
          {verificationMsg ? (
            <div className="text-center py-md">
              <div className="text-heading-sm text-ink-deep font-medium mb-xs">
                Company Created Successfully! 🎉
              </div>
              <p className="text-body-sm text-steel mb-base">{verificationMsg}</p>
              <button
                type="button"
                onClick={() => {
                  setVerificationMsg(null);
                  setMode('LOGIN');
                }}
                className="w-full py-base px-lg bg-ink-deep text-canvas text-body-sm-bold rounded-lg hover:bg-ink transition-colors"
              >
                Proceed to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* ─── Mode Switcher ─── */}
              <div className="flex bg-surface-soft p-1 rounded-lg mb-lg">
                <button
                  type="button"
                  onClick={() => setMode('LOGIN')}
                  className={`flex-1 py-xs text-body-sm-bold rounded-md transition-colors ${
                    mode === 'LOGIN' ? 'bg-canvas text-ink shadow-sm' : 'text-steel hover:text-ink'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('BOOTSTRAP')}
                  className={`flex-1 py-xs text-body-sm-bold rounded-md transition-colors ${
                    mode === 'BOOTSTRAP' ? 'bg-canvas text-ink shadow-sm' : 'text-steel hover:text-ink'
                  }`}
                >
                  Initial Setup
                </button>
              </div>

              {mode === 'BOOTSTRAP' ? (
                /* ─── Company Bootstrap Form (FR-1) ─── */
                <form onSubmit={handleBootstrap} className="flex flex-col gap-base">
                  {isBootstrapped ? (
                    <div className="p-base bg-surface-soft border border-hairline text-ink text-body-sm rounded-lg text-center">
                      The system is already bootstrapped. You can only create one company per instance. Please use the Sign In tab.
                    </div>
                  ) : (
                    <>
                      {bootstrapError && (
                        <div className="p-base bg-surface-soft border border-critical text-critical text-body-sm rounded-lg">
                          {bootstrapError}
                        </div>
                      )}

                      <div>
                        <label className="block text-body-sm-bold text-ink mb-xxs">
                          Company Name <span className="text-critical">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Odoo India"
                          className="w-full px-base py-xs border border-hairline rounded-lg text-body-sm focus:outline-none focus:border-ink"
                        />
                      </div>

                      <div>
                        <label className="block text-body-sm-bold text-ink mb-xxs">
                          Login Prefix (2-4 chars) <span className="text-critical">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          value={loginPrefix}
                          onChange={(e) => setLoginPrefix(e.target.value.toUpperCase())}
                          placeholder="e.g. OI"
                          className="w-full px-base py-xs border border-hairline rounded-lg text-body-sm uppercase focus:outline-none focus:border-ink"
                        />
                        <span className="text-body-sm text-steel text-xs mt-xxs block">
                          Used for generating employee Login IDs (e.g. OIJODO20220001)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-md">
                        <div>
                          <label className="block text-body-sm-bold text-ink mb-xxs">
                            Admin First Name <span className="text-critical">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={adminFirstName}
                            onChange={(e) => setAdminFirstName(e.target.value)}
                            placeholder="John"
                            className="w-full px-base py-xs border border-hairline rounded-lg text-body-sm focus:outline-none focus:border-ink"
                          />
                        </div>
                        <div>
                          <label className="block text-body-sm-bold text-ink mb-xxs">
                            Admin Last Name <span className="text-critical">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={adminLastName}
                            onChange={(e) => setAdminLastName(e.target.value)}
                            placeholder="Doe"
                            className="w-full px-base py-xs border border-hairline rounded-lg text-body-sm focus:outline-none focus:border-ink"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-body-sm-bold text-ink mb-xxs">
                          Admin Work Email <span className="text-critical">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="admin@company.com"
                          className="w-full px-base py-xs border border-hairline rounded-lg text-body-sm focus:outline-none focus:border-ink"
                        />
                      </div>

                      <div>
                        <label className="block text-body-sm-bold text-ink mb-xxs">
                          Admin Phone
                        </label>
                        <input
                          type="tel"
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          placeholder="+91 9876543210"
                          className="w-full px-base py-xs border border-hairline rounded-lg text-body-sm focus:outline-none focus:border-ink"
                        />
                      </div>

                      <div>
                        <label className="block text-body-sm-bold text-ink mb-xxs">
                          Password <span className="text-critical">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={bootstrapPassword}
                          onChange={(e) => setBootstrapPassword(e.target.value)}
                          placeholder="Min 10 chars (upper, lower, num, symbol)"
                          className="w-full px-base py-xs border border-hairline rounded-lg text-body-sm focus:outline-none focus:border-ink"
                        />
                      </div>

                      <div>
                        <label className="block text-body-sm-bold text-ink mb-xxs">
                          Confirm Password <span className="text-critical">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full px-base py-xs border border-hairline rounded-lg text-body-sm focus:outline-none focus:border-ink"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-base px-lg bg-ink-deep text-canvas text-body-sm-bold rounded-lg hover:bg-ink transition-colors disabled:opacity-50 mt-xs"
                      >
                        {isSubmitting ? 'Creating Company…' : 'Create Company & Admin Account'}
                      </button>
                    </>
                  )}
                </form>
              ) : (
                /* ─── Sign In Form (FR-2) ─── */
                <div className="flex flex-col gap-base">
                  <form onSubmit={handleLogin} className="flex flex-col gap-base">
                    {loginError && (
                      <div className="p-base bg-surface-soft border border-critical text-critical text-body-sm rounded-lg">
                        {loginError}
                      </div>
                    )}

                    <div>
                      <label className="block text-body-sm-bold text-ink mb-xxs">
                        Login ID or Email
                      </label>
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. OIJODO20220001 or user@company.com"
                        className="w-full px-base py-xs border border-hairline rounded-lg text-body-sm focus:outline-none focus:border-ink"
                      />
                    </div>

                    <div>
                      <label className="block text-body-sm-bold text-ink mb-xxs">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-base py-xs border border-hairline rounded-lg text-body-sm focus:outline-none focus:border-ink"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-base px-lg bg-ink-deep text-canvas text-body-sm-bold rounded-lg hover:bg-ink transition-colors disabled:opacity-50 mt-xs"
                    >
                      {isSubmitting ? 'Signing in…' : 'Sign In'}
                    </button>
                  </form>

                  {/* Sample Credentials for the user */}
                  <div className="mt-md p-base bg-surface-soft border border-hairline rounded-lg">
                    <h3 className="text-body-sm-bold text-ink mb-xs">🔑 Demo Credentials</h3>
                    <p className="text-body-sm text-steel mb-xs">Use these to test the application:</p>
                    <div className="text-body-sm text-ink space-y-1">
                      <div><strong>👑 Admin:</strong> admin@kaizen.com / AdminPassword1!</div>
                      <div><strong>👤 Employee:</strong> employee@kaizen.com / EmployeePassword1!</div>
                    </div>
                    <div className="flex gap-md mt-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setIdentifier('admin@kaizen.com');
                          setPassword('AdminPassword1!');
                        }}
                        className="text-brand text-body-sm hover:underline"
                      >
                        Auto-fill Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIdentifier('employee@kaizen.com');
                          setPassword('EmployeePassword1!');
                        }}
                        className="text-brand text-body-sm hover:underline"
                      >
                        Auto-fill Employee
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
