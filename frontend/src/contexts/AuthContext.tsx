import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // TODO: Validate token and fetch user data
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email,
        password,
      });
      const { token } = response.data;
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'ログインに失敗しました');
    }
  };

  const register = async (email: string, password: string, username: string) => {
    try {
      console.log('Registering with:', { email, username }); // デバッグ用
      const response = await axios.post('http://localhost:3001/api/auth/register', {
        email,
        password,
        username
      });
      console.log('Register response:', response.data); // デバッグ用
      const { token } = response.data;
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Register error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || '登録に失敗しました');
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
