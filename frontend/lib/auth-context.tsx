'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: string;
  specialty?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Verify token is still valid
      api.get('/auth/profile')
        .then(() => setLoading(false))
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier: string, password: string): Promise<User> => {
    try {
      const response = await api.post('/auth/login', { identifier, password });
      const { access_token, user: userData } = response.data;
      
      console.log('Login response:', { access_token: access_token ? 'received' : 'missing', user: userData });
      
      if (!access_token || !userData) {
        throw new Error('Invalid login response');
      }
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      console.log('User stored:', userData);
      return userData;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: any): Promise<User> => {
    await api.post('/auth/register', data);
    // Auto login after registration
    return await login(data.email || data.phone || data.nationalId, data.password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


