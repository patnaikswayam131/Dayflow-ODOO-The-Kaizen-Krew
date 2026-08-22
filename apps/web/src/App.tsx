import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './layouts/AppLayout';

// ─── Route-based code splitting (Security Checklist Part B #19) ───
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
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

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated routes (wrapped in AppLayout shell) */}
            {/* TODO: Add ProtectedRoute wrapper that checks auth state */}
            <Route
              path="/app"
              element={
                <AppLayout>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route index element={<DashboardPage />} />
                      <Route path="employees/*" element={<EmployeesPage />} />
                      <Route path="attendance/*" element={<AttendancePage />} />
                      <Route path="time-off/*" element={<TimeOffPage />} />
                      <Route path="profile/*" element={<ProfilePage />} />
                    </Routes>
                  </Suspense>
                </AppLayout>
              }
            />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/app" replace />} />

            {/* 404 catch-all (Security Checklist Part B #2) */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
