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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapped, setIsBootstrapped] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check bootstrap status and current user session on mount
  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Check bootstrap status
        const statusRes = await fetch('/api/v1/auth/bootstrap/status');
        if (statusRes.ok) {
          const statusJson: ApiResponse<{ isBootstrapped: boolean }> = await statusRes.json();
          if (statusJson.success && statusJson.data) {
            setIsBootstrapped(statusJson.data.isBootstrapped);
          }
        }

        // 2. Fetch current logged-in user (/auth/me)
        const meRes = await fetch('/api/v1/auth/me', { credentials: 'include' });
        if (meRes.ok) {
          const meJson: ApiResponse<{ user: AuthUser }> = await meRes.json();
          if (meJson.success && meJson.data?.user) {
            setUser(meJson.data.user);
          }
        } else if (meRes.status === 401) {
          // Attempt token refresh
          const refreshRes = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });
          if (refreshRes.ok) {
            const refreshJson: ApiResponse<{ user: AuthUser }> = await refreshRes.json();
            if (refreshJson.success && refreshJson.data?.user) {
              setUser(refreshJson.data.user);
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
    try {
      const meRes = await fetch('/api/v1/auth/me', { credentials: 'include' });
      if (meRes.ok) {
        const meJson: ApiResponse<{ user: AuthUser }> = await meRes.json();
        if (meJson.success && meJson.data?.user) {
          setUser(meJson.data.user);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const login = async (dto: LoginDTO) => {
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
  };

  const bootstrapCompany = async (dto: CompanyBootstrapDTO) => {
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
  };

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
    }
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
