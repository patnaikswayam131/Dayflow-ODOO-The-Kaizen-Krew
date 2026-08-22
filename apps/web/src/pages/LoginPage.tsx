import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function LoginPage() {
  useDocumentTitle('Sign In — Dayflow');
  const { isBootstrapped, login, bootstrapCompany, user } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-8 font-sans">
      
      <div className="w-full max-w-[480px]">
        {/* Title / Form Title */}
        <h2 className="text-white text-lg font-medium mb-4 pl-2 font-mono">
          {mode === 'LOGIN' ? 'Sign in Page' : 'Sign Up Page'}
        </h2>
        
        {/* Card */}
        <div className="border border-[#333] rounded-lg p-8 bg-[#181818] shadow-2xl relative">
          
          {verificationMsg ? (
            <div className="text-center py-8">
              <div className="text-xl text-white font-medium mb-2">
                Company Created Successfully! 🎉
              </div>
              <p className="text-gray-400 text-sm mb-6">{verificationMsg}</p>
              <button
                type="button"
                onClick={() => {
                  setVerificationMsg(null);
                  setMode('LOGIN');
                }}
                className="w-full py-3 bg-[#A855F7] text-white font-semibold rounded-md hover:bg-[#9333EA] transition-colors"
              >
                Proceed to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* App Logo Area */}
              <div className="flex justify-center mb-8">
                <div className="w-full max-w-[240px] h-12 bg-[#222] rounded-md flex items-center justify-center border border-[#333]">
                  <img src="/app-logo.png" alt="Dayflow Logo" className="h-8 object-contain opacity-80" />
                </div>
              </div>

              {mode === 'LOGIN' ? (
                /* ─── Sign In Form ─── */
                <form onSubmit={handleLogin} className="flex flex-col gap-6">
                  {loginError && (
                    <div className="p-3 bg-red-900/20 border border-red-500/50 text-red-400 text-sm rounded-md">
                      {loginError}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label className="text-white text-sm w-[140px] shrink-0 mb-1 sm:mb-0">Login Id/Email :-</label>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="flex-1 bg-transparent border border-[#555] rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#888] focus:ring-1 focus:ring-[#888]"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <label className="text-white text-sm w-[140px] shrink-0 mb-1 sm:mb-0">Password :-</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 bg-transparent border border-[#555] rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#888] focus:ring-1 focus:ring-[#888]"
                    />
                  </div>

                  <div className="mt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-[#A855F7] text-white font-semibold rounded-md hover:bg-[#9333EA] transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Signing in...' : 'SIGN IN'}
                    </button>
                  </div>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setMode('BOOTSTRAP')}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Don't have an Account? Sign Up
                    </button>
                  </div>
                </form>
              ) : (
                /* ─── Sign Up Form ─── */
                <form onSubmit={handleBootstrap} className="flex flex-col gap-5">
                  {isBootstrapped ? (
                    <div className="p-4 bg-surface-soft border border-hairline text-ink text-sm rounded-md text-center">
                      The system is already bootstrapped. Please sign in instead.
                    </div>
                  ) : (
                    <>
                      {bootstrapError && (
                        <div className="p-3 bg-red-900/20 border border-red-500/50 text-red-400 text-sm rounded-md">
                          {bootstrapError}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <label className="text-white text-sm w-[140px] shrink-0 mb-1 sm:mb-0">Company Name :-</label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="flex-1 bg-transparent border-b border-[#555] px-2 py-1 text-white text-sm focus:outline-none focus:border-[#888]"
                        />
                        <div className="hidden sm:flex ml-4 w-8 h-8 bg-blue-600 rounded items-center justify-center cursor-pointer hover:bg-blue-500 shrink-0" title="Upload Logo">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <label className="text-white text-sm w-[140px] shrink-0 mb-1 sm:mb-0">Prefix :-</label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          value={loginPrefix}
                          onChange={(e) => setLoginPrefix(e.target.value.toUpperCase())}
                          className="flex-1 bg-transparent border-b border-[#555] px-2 py-1 text-white text-sm uppercase focus:outline-none focus:border-[#888]"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <label className="text-white text-sm w-[140px] shrink-0 mb-1 sm:mb-0">First Name :-</label>
                        <input
                          type="text"
                          required
                          value={adminFirstName}
                          onChange={(e) => setAdminFirstName(e.target.value)}
                          className="flex-1 bg-transparent border-b border-[#555] px-2 py-1 text-white text-sm focus:outline-none focus:border-[#888]"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <label className="text-white text-sm w-[140px] shrink-0 mb-1 sm:mb-0">Last Name :-</label>
                        <input
                          type="text"
                          required
                          value={adminLastName}
                          onChange={(e) => setAdminLastName(e.target.value)}
                          className="flex-1 bg-transparent border-b border-[#555] px-2 py-1 text-white text-sm focus:outline-none focus:border-[#888]"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <label className="text-white text-sm w-[140px] shrink-0 mb-1 sm:mb-0">Email :-</label>
                        <input
                          type="email"
                          required
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="flex-1 bg-transparent border-b border-[#555] px-2 py-1 text-white text-sm focus:outline-none focus:border-[#888]"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <label className="text-white text-sm w-[140px] shrink-0 mb-1 sm:mb-0">Phone :-</label>
                        <input
                          type="tel"
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          className="flex-1 bg-transparent border-b border-[#555] px-2 py-1 text-white text-sm focus:outline-none focus:border-[#888]"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center relative">
                        <label className="text-white text-sm w-[140px] shrink-0 mb-1 sm:mb-0">Password :-</label>
                        <div className="flex-1 flex">
                          <input
                            type="password"
                            required
                            value={bootstrapPassword}
                            onChange={(e) => setBootstrapPassword(e.target.value)}
                            className="w-full bg-transparent border-b border-[#555] px-2 py-1 text-white text-sm focus:outline-none focus:border-[#888]"
                          />
                        </div>
                        <div className="hidden sm:flex ml-2 w-6 h-6 items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center relative">
                        <label className="text-white text-sm w-[140px] shrink-0 mb-1 sm:mb-0">Confirm Password :-</label>
                        <div className="flex-1 flex">
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-transparent border-b border-[#555] px-2 py-1 text-white text-sm focus:outline-none focus:border-[#888]"
                          />
                        </div>
                        <div className="hidden sm:flex ml-2 w-6 h-6 items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
                        </div>
                      </div>

                      <div className="mt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-2.5 bg-[#A855F7] text-white font-semibold rounded-md hover:bg-[#9333EA] transition-colors disabled:opacity-50"
                        >
                          {isSubmitting ? 'Creating...' : 'Sign Up'}
                        </button>
                      </div>

                      <div className="text-center mt-2">
                        <button
                          type="button"
                          onClick={() => setMode('LOGIN')}
                          className="text-gray-400 hover:text-white text-sm transition-colors"
                        >
                          Already have an account ? Sign In
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )}
            </>
          )}

          {/* Demo Credentials for ease of testing */}
          {mode === 'LOGIN' && (
            <div className="mt-8 pt-4 border-t border-[#333] text-gray-400 text-xs">
              <p className="mb-2 text-gray-300">🔑 Quick Login (Demo):</p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('admin@dayflow.com');
                    setPassword('AdminPassword1!');
                  }}
                  className="hover:text-white underline decoration-gray-600"
                >
                  Fill Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('employee@dayflow.com');
                    setPassword('EmployeePassword1!');
                  }}
                  className="hover:text-white underline decoration-gray-600"
                >
                  Fill Employee
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
