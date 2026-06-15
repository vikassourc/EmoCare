import { createContext, useContext, useState, useEffect } from 'react';
import { api, getUser, getToken, setAuth, clearAuth } from '../api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (!getToken()) { setLoading(false); return; }
      try {
        const data = await api.getMe();
        const u = data.user || data;
        setUser(u);
        localStorage.setItem('emocare_user', JSON.stringify(u));
      } catch {
        clearAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    setAuth(data.token, data.user);
    setUser(data.user);
    return data;
  };

  const signup = async (name, email, password) => {
    const data = await api.signup({ name, email, password });
    setAuth(data.token, data.user);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
