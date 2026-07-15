import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('cc_user');
    const token = localStorage.getItem('cc_token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  // Handle Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    if (user && token) {
      const newSocket = io(import.meta.env.VITE_API_URL,  {
        auth: { token }
      });
      setSocket(newSocket);
      return () => {
        newSocket.disconnect();
      };
    } else {
      setSocket(null);
    }
  }, [user]);

  const login = async (email, password, role) => {
    const res = await authService.login({ email, password, role });
    const { token, user: userData } = res.data;
    localStorage.setItem('cc_token', token);
    localStorage.setItem('cc_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, socket, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
