'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from './api-client';
import { User, LoginRequest, RegisterRequest } from './types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load session token from localStorage on mount
    const storedToken = localStorage.getItem('lgx_session_token');
    if (storedToken) {
      apiClient.setSessionToken(storedToken);
      // Fetch user info
      apiClient.getMe()
        .then(setUser)
        .catch(() => {
          // Invalid token, clear it
          localStorage.removeItem('lgx_session_token');
          apiClient.clearSessionToken();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (data: LoginRequest) => {
    const session = await apiClient.login(data);
    localStorage.setItem('lgx_session_token', session.token);
    apiClient.setSessionToken(session.token);
    setUser(session.user);
  };

  const register = async (data: RegisterRequest) => {
    const session = await apiClient.register(data);
    localStorage.setItem('lgx_session_token', session.token);
    apiClient.setSessionToken(session.token);
    setUser(session.user);
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('lgx_session_token');
    apiClient.clearSessionToken();
    setUser(null);
  };

  const refreshUser = async () => {
    const userData = await apiClient.getMe();
    setUser(userData);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
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
