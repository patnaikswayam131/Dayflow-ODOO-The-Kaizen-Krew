import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * AppLayout — Persistent top navigation bar (FR-7).
 *
 * Company Logo | Employees | Attendance | Time Off | Check-in status dot | Avatar dropdown
 */
interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCheckedIn = false; // Attendance state will be driven by Attendance module
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const userInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* ─── Top Navigation Bar ─── */}
      <header
        className="sticky top-0 z-50 bg-canvas border-b border-hairline-soft"
        style={{ height: '64px' }}
      >
        <nav className="h-full max-w-[1280px] mx-auto px-xxl flex items-center justify-between">
          {/* Left: Company Logo */}
          <a href="/app" className="flex items-center gap-xs" aria-label="Dayflow Home">
            <div className="w-8 h-8 bg-ink-deep rounded-lg flex items-center justify-center">
              <span className="text-white text-body-sm-bold">
                {user?.companyName?.charAt(0) || 'D'}
              </span>
            </div>
            <span className="text-heading-sm text-ink-deep font-medium hidden sm:block">
              {user?.companyName || 'Dayflow'}
            </span>
          </a>

          {/* Center: Navigation Tabs (pill-tab style from design.md) */}
          <div className="flex items-center gap-xs">
            <NavTab href="/app/employees" label="Employees" isActive={currentPath.startsWith('/app/employees')} />
            <NavTab href="/app/attendance" label="Attendance" isActive={currentPath.startsWith('/app/attendance')} />
            <NavTab href="/app/time-off" label="Time Off" isActive={currentPath.startsWith('/app/time-off')} />
          </div>

          {/* Right: Status dot + Avatar dropdown */}
          <div className="flex items-center gap-md-sp">
            {/* Check-in status dot (FR-8) */}
            <button
              className="flex items-center gap-xxs text-body-sm text-steel"
              aria-label={isCheckedIn ? 'Checked in' : 'Not checked in'}
              title={isCheckedIn ? 'Checked in today' : 'Not checked in today'}
            >
              <span
                className={`inline-block w-[10px] h-[10px] rounded-full ${
                  isCheckedIn ? 'bg-success' : 'bg-critical'
                }`}
                role="status"
                aria-live="polite"
              />
              <span className="hidden md:inline">
                {isCheckedIn ? 'Checked in' : 'Not checked in'}
              </span>
            </button>

            {/* Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-[40px] h-[40px] rounded-full bg-ink-deep text-canvas flex items-center justify-center text-body-sm-bold transition-transform hover:scale-105"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{userInitials}</span>
                )}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  className="absolute right-0 top-[48px] w-[220px] bg-canvas rounded-xl border border-hairline-soft shadow-sticky-panel py-xs z-50"
                  role="menu"
                  aria-label="User menu options"
                >
                  <div className="px-base py-xs border-b border-hairline-soft mb-xs">
                    <div className="text-body-sm-bold text-ink-deep truncate">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-body-xs text-steel truncate">{user?.email}</div>
                    <div className="text-body-xs text-stone font-mono mt-xxs">
                      ID: {user?.loginId} ({user?.role})
                    </div>
                  </div>

                  <a
                    href="/app/profile"
                    className="block px-base py-xs text-body-sm text-ink hover:bg-surface-soft transition-colors"
                    role="menuitem"
                  >
                    My Profile
                  </a>

                  <hr className="my-xs border-hairline-soft" />

                  <button
                    className="w-full text-left px-base py-xs text-body-sm text-critical hover:bg-surface-soft transition-colors font-medium"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* ─── Main Content Area ─── */}
      <main className="max-w-[1280px] mx-auto px-xxl py-xxl">
        {children}
      </main>
    </div>
  );
}

/**
 * Navigation tab pill component (design.md button-pill-tab).
 */
function NavTab({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <a
      href={href}
      className={`
        inline-flex items-center justify-center
        text-body-sm-bold rounded-full
        px-base py-xs
        transition-colors duration-150 ease-out
        ${
          isActive
            ? 'bg-ink-deep text-canvas'
            : 'bg-canvas text-ink border border-hairline hover:bg-surface-soft'
        }
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </a>
  );
}
