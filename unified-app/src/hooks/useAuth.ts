import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'user' | 'agent';
  permissions: string[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  getAuthHeaders: () => Record<string, string | undefined>;
}

const AUTH_STORAGE_KEY = 'workflow_auth_token';
const REFRESH_TOKEN_KEY = 'workflow_refresh_token';

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });

          if (!response.ok) {
            throw new Error('Login failed');
          }

          const data = await response.json();

          // Store tokens
          localStorage.setItem(AUTH_STORAGE_KEY, data.accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);

          set({
            user: data.user,
            token: data.accessToken,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      refreshToken: async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();

          localStorage.setItem(AUTH_STORAGE_KEY, data.accessToken);
          set({ token: data.accessToken });
        } catch (error) {
          // If refresh fails, logout
          get().logout();
          throw error;
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          // Verify token with server
          const response = await fetch('/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            set({
              user: data.user,
              token,
              isAuthenticated: true
            });
          } else {
            // Token invalid, try refresh
            await get().refreshToken();
          }
        } catch (error) {
          set({ isAuthenticated: false });
        }
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;

        return user.role === 'admin' ||
               user.permissions.includes(permission) ||
               user.permissions.includes('*');
      },

      getAuthHeaders: () => {
        const { token } = get();
        if (token) {
          return { 'Authorization': `Bearer ${token}` };
        }
        return {};
      }
    }),
    {
      name: 'auth-store',
    }
  )
);

// WebSocket authentication helper
export const createAuthenticatedWebSocket = (url: string): WebSocket => {
  const { token } = useAuthStore.getState();

  const ws = new WebSocket(url);

  ws.onopen = () => {
    // Send authentication message
    if (token) {
      ws.send(JSON.stringify({
        type: 'authenticate',
        token
      }));
    }
  };

  return ws;
};

// HTTP request wrapper with auth
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const { getAuthHeaders, refreshToken } = useAuthStore.getState();

  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };

  let response = await fetch(url, { ...options, headers });

  // If unauthorized, try refreshing token
  if (response.status === 401) {
    try {
      await refreshToken();
      const newHeaders = {
        ...useAuthStore.getState().getAuthHeaders(),
        ...options.headers
      };
      response = await fetch(url, { ...options, headers: newHeaders });
    } catch {
      // Refresh failed, user needs to login again
      useAuthStore.getState().logout();
    }
  }

  return response;
};

// Role-based guards
export const requireAuth = () => {
  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) {
    throw new Error('Authentication required');
  }
};

export const requirePermission = (permission: string) => {
  const { hasPermission } = useAuthStore.getState();
  if (!hasPermission(permission)) {
    throw new Error(`Permission required: ${permission}`);
  }
};

export const requireRole = (role: AuthUser['role']) => {
  const { user } = useAuthStore.getState();
  if (!user || user.role !== role) {
    throw new Error(`Role required: ${role}`);
  }
};