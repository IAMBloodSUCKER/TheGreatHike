import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearAuthSession,
  patchAuthProfile,
  readAdminFlag,
  readGender,
  readToken,
  readUsername,
  saveAuthSession,
} from '../authStorage';
import { api, UserGender } from '../api';

interface AuthState {
  token: string | null;
  username: string | null;
  isAdmin: boolean;
  gender: UserGender;
  isAuthenticated: boolean;
  login: (
    token: string,
    username: string,
    admin?: boolean,
    gender?: UserGender,
    remember?: boolean,
  ) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken);
  const [username, setUsername] = useState<string | null>(readUsername);
  const [isAdmin, setIsAdmin] = useState(readAdminFlag);
  const [gender, setGender] = useState<UserGender>(readGender);

  const refreshProfile = useCallback(async () => {
    if (!readToken()) {
      return;
    }
    try {
      const me = await api.me();
      patchAuthProfile(me.username, me.admin, me.gender);
      setUsername(me.username);
      setIsAdmin(me.admin);
      setGender(me.gender);
    } catch {
      // token expired — keep local state
    }
  }, []);

  useEffect(() => {
    if (token) {
      refreshProfile();
    }
  }, [token, refreshProfile]);

  const value = useMemo<AuthState>(
    () => ({
      token,
      username,
      isAdmin,
      gender,
      isAuthenticated: !!token,
      login: (t, u, admin = false, g, remember = true) => {
        saveAuthSession(t, u, admin, remember, g);
        if (g) {
          setGender(g);
        }
        setToken(t);
        setUsername(u);
        setIsAdmin(admin);
      },
      logout: () => {
        clearAuthSession();
        setToken(null);
        setUsername(null);
        setIsAdmin(false);
        setGender('MALE');
      },
      refreshProfile,
    }),
    [token, username, isAdmin, gender, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
