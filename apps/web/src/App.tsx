import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserRole } from '@dayflow/shared';
import { AppLayout } from './layouts/AppLayout';
import { AuthProvider, useAuth } from './context/AuthContext';

// ─── Route-based code splitting (Security Checklist Part B #19) ───
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const SignUpPage = lazy(() =>
  import('./pages/SignUpPage').then((m) => ({ default: m.SignUpPage })),
);
const EmployeesPage = lazy(() =>
  import('./pages/EmployeesPage').then((m) => ({ default: m.EmployeesPage })),
);
const AttendancePage = lazy(() =>
  import('./pages/AttendancePage').then((m) => ({ default: m.AttendancePage })),
);
const TimeOffPage = lazy(() =>
  import('./pages/TimeOffPage').then((m) => ({ default: m.TimeOffPage })),
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const CompanySettingsPage = lazy(() =>
  import('./pages/CompanySettingsPage').then((m) => ({ default: m.CompanySettingsPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

// ─── TanStack Query client ───
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── Loading fallback ───
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-body-sm text-steel">Loading…</div>
    </div>
  );
}

function landingPathForRole(role: UserRole) {
  if (role === UserRole.EMPLOYEE) {
    return '/app/profile';
  }
  return '/app/employees';
}

function AppHomeRedirect() {
  const { currentRole } = useAuth();
  return <Navigate to={landingPathForRole(currentRole)} replace />;
}

function ProtectedApp({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RoleRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}) {
  const { currentRole } = useAuth();
  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to={landingPathForRole(currentRole)} replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />

              {/* Authenticated routes (wrapped in AppLayout shell) */}
              <Route
                path="/app/*"
                element={
                  <ProtectedApp>
                    <AppLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route index element={<AppHomeRedirect />} />
                          <Route path="dashboard" element={<AppHomeRedirect />} />
                          <Route
                            path="employees/*"
                            element={
                              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.HR_OFFICER]}>
                                <EmployeesPage />
                              </RoleRoute>
                            }
                          />
                          <Route path="attendance/*" element={<AttendancePage />} />
                          <Route path="time-off/*" element={<TimeOffPage />} />
                          <Route path="profile/*" element={<ProfilePage />} />
                          <Route
                            path="settings/company"
                            element={
                              <RoleRoute allowedRoles={[UserRole.ADMIN]}>
                                <CompanySettingsPage />
                              </RoleRoute>
                            }
                          />
                        </Routes>
                      </Suspense>
                    </AppLayout>
                  </ProtectedApp>
                }
              />

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* 404 catch-all (Security Checklist Part B #2) */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
