import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI, userAPI, TOKEN_KEY, USER_KEY } from '../services/api.js';

const AuthContext = createContext(null);

const readSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(readSavedUser);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAdmin(null);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    userAPI
      .getProfile()
      .then((result) => {
        if (result.user.role !== 'admin') throw new Error('Not an admin account');
        setAdmin(result.user);
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      })
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [clearSession]);

  useEffect(() => {
    const handleExpired = () => setAdmin(null);
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (credentials) => {
    const result = await authAPI.adminLogin(credentials);
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setAdmin(result.user);
    return result.user;
  };

  const value = useMemo(
    () => ({ admin, loading, isAuthenticated: Boolean(admin), login, logout: clearSession }),
    [admin, loading, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
