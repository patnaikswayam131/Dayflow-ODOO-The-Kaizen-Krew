import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser, CompanyBootstrapDTO, LoginDTO, ApiResponse } from '@dayflow/shared';

interface AuthContextType {
  user: AuthUser | null;
  isBootstrapped: boolean | null;
  isLoading: boolean;
  login: (dto: LoginDTO) => Promise<void>;
  bootstrapCompany: (dto: CompanyBootstrapDTO) => Promise<{ verificationMessage: string }>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Mock Data (used when API / DB is unavailable) ───
const MOCK_ADMIN: AuthUser = {
  id: 'mock-admin-001',
  loginId: 'KKADUS20260001',
  email: 'admin@kaizen.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
  avatarUrl: null,
  mustChangePassword: false,
  companyId: 'mock-company-001',
  companyName: 'Kaizen Krew',
  companyLogoUrl: null,
};

const MOCK_EMPLOYEE: AuthUser = {
  id: 'mock-emp-001',
  loginId: 'KKJODO20260001',
  email: 'employee@kaizen.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'EMPLOYEE',
  avatarUrl: null,
  mustChangePassword: false,
  companyId: 'mock-company-001',
  companyName: 'Kaizen Krew',
  companyLogoUrl: null,
};

const MOCK_CREDENTIALS: Record<string, { password: string; user: AuthUser }> = {
  'admin@kaizen.com': { password: 'AdminPassword1!', user: MOCK_ADMIN },
  'KKADUS20260001': { password: 'AdminPassword1!', user: MOCK_ADMIN },
  'employee@kaizen.com': { password: 'EmployeePassword1!', user: MOCK_EMPLOYEE },
  'KKJODO20260001': { password: 'EmployeePassword1!', user: MOCK_EMPLOYEE },
};

const STORAGE_KEY = 'dayflow_auth_user';
const BOOTSTRAP_KEY = 'dayflow_bootstrapped';

// ─── API helpers ───
async function tryFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(url, init);
    return res;
  } catch {
    return null; // API unreachable
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapped, setIsBootstrapped] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  // Check API health, bootstrap status, and session on mount
  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Probe API health
        const healthRes = await tryFetch('/api/v1/health');
        const isApiUp = healthRes !== null && healthRes.ok;
        setApiAvailable(isApiUp);

        if (isApiUp) {
          // ── API is available — use real auth ──
          const statusRes = await tryFetch('/api/v1/auth/bootstrap/status');
          if (statusRes?.ok) {
            const statusJson: ApiResponse<{ isBootstrapped: boolean }> = await statusRes.json();
            if (statusJson.success && statusJson.data) {
              setIsBootstrapped(statusJson.data.isBootstrapped);
            }
          }

          const meRes = await tryFetch('/api/v1/auth/me', { credentials: 'include' });
          if (meRes?.ok) {
            const meJson: ApiResponse<{ user: AuthUser }> = await meRes.json();
            if (meJson.success && meJson.data?.user) {
              setUser(meJson.data.user);
            }
          } else if (meRes?.status === 401) {
            const refreshRes = await tryFetch('/api/v1/auth/refresh', {
              method: 'POST',
              credentials: 'include',
            });
            if (refreshRes?.ok) {
              const refreshJson: ApiResponse<{ user: AuthUser }> = await refreshRes.json();
              if (refreshJson.success && refreshJson.data?.user) {
                setUser(refreshJson.data.user);
              }
            }
          }
        } else {
          // ── API is NOT available — use localStorage mock ──
          console.warn('[Auth] API unreachable — running in offline/demo mode');

          const storedBootstrap = localStorage.getItem(BOOTSTRAP_KEY);
          setIsBootstrapped(storedBootstrap === 'true');

          const storedUser = localStorage.getItem(STORAGE_KEY);
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        }
      } catch (err) {
        console.error('[Auth] Failed to initialize auth state:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const refetchUser = async () => {
    if (apiAvailable) {
      try {
        const meRes = await fetch('/api/v1/auth/me', { credentials: 'include' });
        if (meRes.ok) {
          const meJson: ApiResponse<{ user: AuthUser }> = await meRes.json();
          if (meJson.success && meJson.data?.user) {
            setUser(meJson.data.user);
            return;
          }
        }
        setUser(null);
      } catch {
        setUser(null);
      }
    }
    // In mock mode, user is already in state
  };

  const login = async (dto: LoginDTO) => {
    if (apiAvailable) {
      // ── Real API login ──
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
        credentials: 'include',
      });

      const data: ApiResponse<{ user: AuthUser }> = await res.json();
      if (!res.ok || !data.success || !data.data?.user) {
        throw new Error(data.error?.message || 'Invalid credentials');
      }

      setUser(data.data.user);
    } else {
      // ── Mock login ──
      const entry = MOCK_CREDENTIALS[dto.identifier];
      if (!entry || entry.password !== dto.password) {
        // Also check dynamically bootstrapped users
        const dynamicUsersRaw = localStorage.getItem('dayflow_dynamic_users');
        if (dynamicUsersRaw) {
          try {
            const dynamicUsers: Record<string, { password: string; user: AuthUser }> = JSON.parse(dynamicUsersRaw);
            const dynEntry = dynamicUsers[dto.identifier];
            if (dynEntry && dynEntry.password === dto.password) {
              setUser(dynEntry.user);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(dynEntry.user));
              return;
            }
          } catch { /* ignore */ }
        }
        throw new Error('Invalid credentials');
      }

      setUser(entry.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entry.user));
    }
  };

  const bootstrapCompany = async (dto: CompanyBootstrapDTO) => {
    if (apiAvailable) {
      // ── Real API bootstrap ──
      const res = await fetch('/api/v1/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });

      const data: ApiResponse<{ user: AuthUser; verificationMessage: string }> = await res.json();
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error?.message || 'Bootstrap failed');
      }

      setIsBootstrapped(true);
      return { verificationMessage: data.data.verificationMessage };
    } else {
      // ── Mock bootstrap ──
      if (localStorage.getItem(BOOTSTRAP_KEY) === 'true') {
        throw new Error('System already bootstrapped. Only one company is allowed.');
      }

      const prefix = dto.loginPrefix.toUpperCase();
      const firstInitials = (dto.adminFirstName.substring(0, 2) + dto.adminLastName.substring(0, 2)).toUpperCase();
      const loginId = `${prefix}${firstInitials}${new Date().getFullYear()}0001`;

      const mockUser: AuthUser = {
        id: `mock-${Date.now()}`,
        loginId,
        email: dto.adminEmail.toLowerCase(),
        firstName: dto.adminFirstName,
        lastName: dto.adminLastName,
        role: 'ADMIN',
        avatarUrl: null,
        mustChangePassword: false,
        companyId: `mock-company-${Date.now()}`,
        companyName: dto.companyName,
        companyLogoUrl: null,
      };

      // Save to dynamic users so they can login
      const dynamicUsersRaw = localStorage.getItem('dayflow_dynamic_users');
      const dynamicUsers: Record<string, { password: string; user: AuthUser }> = dynamicUsersRaw ? JSON.parse(dynamicUsersRaw) : {};
      dynamicUsers[dto.adminEmail.toLowerCase()] = { password: dto.password, user: mockUser };
      dynamicUsers[loginId] = { password: dto.password, user: mockUser };
      localStorage.setItem('dayflow_dynamic_users', JSON.stringify(dynamicUsers));

      localStorage.setItem(BOOTSTRAP_KEY, 'true');
      setIsBootstrapped(true);

      return {
        verificationMessage: `Company "${dto.companyName}" created! Your Login ID is ${loginId}. You can now sign in.`,
      };
    }
  };

  const logout = async () => {
    if (apiAvailable) {
      try {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch {
        // Ignore — we'll clear local state anyway
      }
    }

    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isBootstrapped,
        isLoading,
        login,
        bootstrapCompany,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
