import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { API_URL } from '../api/api';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function loadFromStorage(): AuthState {
  try {
    const token = localStorage.getItem(STORAGE_KEY);
    const raw = localStorage.getItem(USER_KEY);
    if (token && raw) {
      return { token, user: JSON.parse(raw) };
    }
  } catch { /* ignore */ }
  return { token: null, user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadFromStorage);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    localStorage.setItem(STORAGE_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ token: data.token, user: data.user });
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    localStorage.setItem(STORAGE_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ token: data.token, user: data.user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('selectedCustomerIds');
    setState({ token: null, user: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
