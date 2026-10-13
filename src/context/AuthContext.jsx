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
  const [user, setUser] = useState(readSavedUser);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const saveSession = (token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setProvider(null);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    userAPI
      .getProfile()
      .then((result) => {
        setUser(result.user);
        setProvider(result.provider);
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setProvider(null);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (credentials) => {
    const result = await authAPI.login(credentials);
    saveSession(result.token, result.user);
    if (result.user.role === 'provider') {
      const profile = await userAPI.getProfile();
      setProvider(profile.provider);
    }
    return result.user;
  };

  const register = async (payload) => {
    const result = await authAPI.register(payload);
    saveSession(result.token, result.user);
    setProvider(result.provider || null);
    return result;
  };

  const updateSession = (userData, providerData) => {
    setUser(userData);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    if (providerData !== undefined) setProvider(providerData);
  };

  const value = useMemo(
    () => ({
      user,
      provider,
      loading,
      isAuthenticated: Boolean(user),
      isProvider: user?.role === 'provider',
      login,
      register,
      logout: clearSession,
      updateSession,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, provider, loading, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
