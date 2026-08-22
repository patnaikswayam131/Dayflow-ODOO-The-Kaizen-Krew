import { useState, useRef, useEffect } from 'react';
import { UserRole } from '@dayflow/shared';

/**
 * AppLayout — Persistent top navigation bar (FR-7).
 *
 * Company Logo | Employees | Attendance | Time Off | Company Settings | Check-in status dot | Avatar dropdown
 *
 * Design tokens from design.md:
 * - Nav bar: white canvas, 64px height, bottom 1px hairline-soft border
 * - Active tab: ink-deep bg, canvas text (button-pill-tab-active)
 * - Inactive tab: canvas bg, ink text, hairline border (button-pill-tab)
 * - Avatar dropdown: card-elevated style
 */
interface AppLayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
  userAvatar?: string;
  userName?: string;
  onLogout?: () => void;
}

export function AppLayout({
  children,
  userRole = UserRole.ADMIN, // Default to ADMIN for dev preview
  userAvatar,
  userName = 'Admin User',
  onLogout,
}: AppLayoutProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
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

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  return (
    <div className="min-h-screen bg-surface-soft text-ink flex flex-col font-sans">
      {/* ─── Top Navigation Bar (FR-7) ─── */}
      <header
        className="sticky top-0 z-50 bg-canvas border-b border-hairline-soft"
        style={{ height: '64px' }}
      >
        <nav
          aria-label="Main Navigation"
          className="h-full max-w-[1280px] mx-auto px-xxl flex items-center justify-between"
        >
          {/* Left: Company Logo */}
          <a href="/app" className="flex items-center gap-xs" aria-label="Dayflow Home">
            <div className="w-8 h-8 bg-ink-deep rounded-lg flex items-center justify-center text-white">
              <span className="text-body-sm-bold">D</span>
            </div>
            <span className="text-heading-sm text-ink-deep font-semibold hidden sm:block">
              Dayflow
            </span>
          </a>

          {/* Center: Navigation Tabs (pill-tab style from design.md) */}
          <div className="flex items-center gap-xs">
            <NavTab
              href="/app/employees"
              label="Employees"
              isActive={currentPath.startsWith('/app/employees')}
            />
            <NavTab
              href="/app/attendance"
              label="Attendance"
              isActive={currentPath.startsWith('/app/attendance')}
            />
            <NavTab
              href="/app/time-off"
              label="Time Off"
              isActive={currentPath.startsWith('/app/time-off')}
            />
            {userRole === UserRole.ADMIN && (
              <NavTab
                href="/app/settings/company"
                label="Settings"
                isActive={currentPath.startsWith('/app/settings')}
              />
            )}
          </div>

          {/* Right: Status dot + Avatar dropdown */}
          <div className="flex items-center gap-md">
            {/* Check-in status dot (FR-8) */}
            <button
              onClick={() => setIsCheckedIn(!isCheckedIn)}
              className="flex items-center gap-xs text-body-sm text-steel hover:text-ink transition-colors px-xs py-xxs rounded-full border border-transparent hover:border-hairline-soft"
              aria-label={isCheckedIn ? 'Checked in. Click to toggle.' : 'Not checked in. Click to check in.'}
              title={isCheckedIn ? 'Checked in today (click to toggle)' : 'Not checked in today (click to toggle)'}
            >
              <span
                className={`inline-block w-[10px] h-[10px] rounded-full transition-colors ${
                  isCheckedIn ? 'bg-success' : 'bg-critical'
                }`}
                role="status"
                aria-live="polite"
              />
              <span className="hidden md:inline font-medium text-caption-bold">
                {isCheckedIn ? 'Checked in' : 'Not checked in'}
              </span>
            </button>

            {/* Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-[40px] h-[40px] rounded-full bg-surface-soft border border-hairline flex items-center justify-center text-body-sm-bold text-ink-deep hover:border-ink transition-colors overflow-hidden"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                aria-label={`User menu for ${userName}`}
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={`${userName} avatar`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span aria-hidden="true">{userName.charAt(0)}</span>
                )}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  className="absolute right-0 top-[48px] w-[220px] bg-canvas rounded-xl border border-hairline-soft shadow-lg py-xs z-50 animate-in fade-in duration-150"
                  role="menu"
                  aria-label="User menu options"
                >
                  <div className="px-base py-xs border-b border-hairline-soft mb-xxs">
                    <span className="block text-body-sm-bold text-ink-deep truncate">
                      {userName}
                    </span>
                    <span className="block text-caption text-steel uppercase tracking-wider">
                      {userRole}
                    </span>
                  </div>

                  <a
                    href="/app/profile"
                    className="block px-base py-xs text-body-sm text-ink hover:bg-surface-soft transition-colors"
                    role="menuitem"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    My Profile
                  </a>

                  {userRole === UserRole.ADMIN && (
                    <a
                      href="/app/settings/company"
                      className="block px-base py-xs text-body-sm text-ink hover:bg-surface-soft transition-colors"
                      role="menuitem"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Company Settings
                    </a>
                  )}

                  <hr className="my-xs border-hairline-soft" />

                  <button
                    className="w-full text-left px-base py-xs text-body-sm text-critical hover:bg-surface-soft transition-colors"
                    role="menuitem"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onLogout) onLogout();
                    }}
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
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-xxl py-xxl">
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
