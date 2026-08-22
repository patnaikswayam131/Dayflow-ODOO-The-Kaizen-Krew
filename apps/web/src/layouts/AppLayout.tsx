import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { UserRole } from '@dayflow/shared';
import { useAuth } from '../context/AuthContext';

interface AppLayoutProps {
  children: ReactNode;
}

function formatRole(role: UserRole) {
  return role
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentUser, currentRole, isCheckedIn, toggleCheckIn, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isManager = currentRole === UserRole.ADMIN || currentRole === UserRole.HR_OFFICER;
  const initials = `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase();

  const navItems = useMemo(
    () =>
      [
        { to: '/app/employees', label: 'Employees', show: isManager },
        { to: '/app/attendance', label: 'Attendance', show: true },
        { to: '/app/time-off', label: 'Time Off', show: true },
        { to: '/app/profile', label: 'My Profile', show: true },
        { to: '/app/settings/company', label: 'Settings', show: currentRole === UserRole.ADMIN },
      ].filter((item) => item.show),
    [currentRole, isManager],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-ink font-sans">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-hairline-soft bg-canvas lg:flex lg:flex-col">
        <BrandBlock />
        <AppNav items={navItems} onNavigate={() => undefined} />
        <div className="border-t border-hairline-soft p-md-sp">
          <p className="text-caption-bold text-stone">Signed in as</p>
          <p className="mt-xxs text-body-sm-bold text-ink-deep">{formatRole(currentRole)}</p>
          <p className="mt-xxs truncate text-caption text-steel">{currentUser.loginId}</p>
        </div>
      </aside>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-deep/45"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside className="relative flex h-full w-[280px] flex-col border-r border-hairline-soft bg-canvas shadow-sticky-panel">
            <div className="flex items-center justify-between border-b border-hairline-soft pr-base">
              <BrandBlock compact />
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline-soft text-body-sm-bold text-ink"
                aria-label="Close menu"
              >
                X
              </button>
            </div>
            <AppNav items={navItems} onNavigate={() => setIsMenuOpen(false)} />
            <button
              type="button"
              onClick={handleLogout}
              className="m-md-sp rounded-lg border border-critical px-base py-xs text-left text-body-sm-bold text-critical"
            >
              Log Out
            </button>
          </aside>
        </div>
      )}

      <div className="lg:ml-[260px] lg:w-[calc(100%_-_260px)]">
        <header className="sticky top-0 z-30 border-b border-hairline-soft bg-canvas/95 backdrop-blur">
          <div className="flex min-h-[72px] items-center justify-between gap-base px-base md:px-xxl">
            <div className="flex min-w-0 items-center gap-base">
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-hairline-soft bg-surface-soft"
                aria-label="Open navigation menu"
              >
                <span className="h-0.5 w-5 rounded-full bg-ink" />
                <span className="h-0.5 w-5 rounded-full bg-ink" />
                <span className="h-0.5 w-5 rounded-full bg-ink" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-deep text-body-md-bold text-canvas md:flex lg:hidden"
                aria-label="Go to assigned home"
              >
                D
              </button>
              <div className="hidden min-w-[260px] items-center rounded-full border border-hairline-soft bg-surface-soft px-base py-xs md:flex">
                <span className="text-caption-bold text-stone">Search</span>
                <input
                  type="search"
                  placeholder="employee, leave, attendance"
                  className="ml-xs flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-stone"
                />
              </div>
            </div>

            <div className="flex items-center gap-xs md:gap-base">
              <span className="hidden rounded-full border border-hairline-soft bg-surface-soft px-base py-xs text-caption-bold text-steel md:inline-flex">
                {formatRole(currentRole)}
              </span>

              <button
                type="button"
                onClick={toggleCheckIn}
                className={[
                  'flex min-h-10 items-center gap-xs rounded-full border px-base text-body-sm-bold transition-colors',
                  isCheckedIn
                    ? 'border-success/30 bg-success/10 text-success'
                    : 'border-critical/30 bg-critical/10 text-critical',
                ].join(' ')}
                aria-label={isCheckedIn ? 'Check out' : 'Check in'}
              >
                <span
                  className={[
                    'h-2.5 w-2.5 rounded-full',
                    isCheckedIn ? 'bg-success' : 'bg-critical',
                  ].join(' ')}
                />
                <span className="hidden sm:inline">{isCheckedIn ? 'Checked in' : 'Check in'}</span>
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((open) => !open)}
                  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-hairline-soft bg-surface-soft text-body-sm-bold text-ink-deep transition-colors hover:border-hairline"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  aria-label={`User menu for ${currentUser.firstName} ${currentUser.lastName}`}
                >
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={`${currentUser.firstName} ${currentUser.lastName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </button>

                {isDropdownOpen && (
                  <div
                    className="absolute right-0 top-[52px] w-[260px] rounded-lg border border-hairline-soft bg-canvas p-xs shadow-sticky-panel"
                    role="menu"
                  >
                    <div className="border-b border-hairline-soft px-md-sp py-sm-sp">
                      <p className="truncate text-body-sm-bold text-ink-deep">
                        {currentUser.firstName} {currentUser.lastName}
                      </p>
                      <p className="truncate text-caption text-steel">{currentUser.email}</p>
                      <p className="mt-xxs text-caption-bold text-primary">{formatRole(currentRole)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/app/profile');
                      }}
                      className="mt-xs w-full rounded-md px-md-sp py-xs text-left text-body-sm text-ink hover:bg-surface-soft"
                      role="menuitem"
                    >
                      My Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-xs w-full rounded-md px-md-sp py-xs text-left text-body-sm-bold text-critical hover:bg-critical/10"
                      role="menuitem"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-base py-lg-sp md:px-xxl md:py-xxl">
          {children}
        </main>
      </div>
    </div>
  );
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex h-[72px] items-center gap-base border-b border-hairline-soft px-xl ${compact ? 'border-b-0' : ''}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-deep text-body-md-bold text-canvas">
        D
      </div>
      <div>
        <p className="text-body-md-bold text-ink-deep">Dayflow</p>
        <p className="text-caption text-steel">HR operations suite</p>
      </div>
    </div>
  );
}

function AppNav({
  items,
  onNavigate,
}: {
  items: Array<{ to: string; label: string }>;
  onNavigate: () => void;
}) {
  return (
    <nav className="flex-1 space-y-xxs px-md-sp py-lg-sp" aria-label="Main navigation">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              'flex min-h-11 items-center justify-between rounded-lg px-base py-xs text-body-sm-bold transition-colors',
              isActive
                ? 'bg-ink-deep text-canvas'
                : 'text-steel hover:bg-surface-soft hover:text-ink-deep',
            ].join(' ')
          }
        >
          <span>{item.label}</span>
          <span className="text-caption">/</span>
        </NavLink>
      ))}
    </nav>
  );
}
