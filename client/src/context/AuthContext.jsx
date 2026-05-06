import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('comtrade_token');
    const savedUser = localStorage.getItem('comtrade_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem('comtrade_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('comtrade_token');
          localStorage.removeItem('comtrade_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credential, password) => {
    const res = await api.post('/auth/login', { credential, password });
    localStorage.setItem('comtrade_token', res.data.token);
    localStorage.setItem('comtrade_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (nama, nim, password) => {
    const res = await api.post('/auth/register', { nama, nim, password });
    localStorage.setItem('comtrade_token', res.data.token);
    localStorage.setItem('comtrade_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('comtrade_token');
    localStorage.removeItem('comtrade_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
