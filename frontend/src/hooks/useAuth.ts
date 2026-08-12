// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  club_slug?: string;
}

interface AuthHook {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isTokenValid: () => boolean;
}

export function useAuth(): AuthHook {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      // Check if token is still valid
      if (isTokenValid(storedToken)) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        // Token expired, clear everything
        logout();
      }
    }
  }, []);

  /**
   * Check if JWT token is still valid (not expired)
   */
  const isTokenValid = (tokenToCheck?: string): boolean => {
    const tokenString = tokenToCheck || token;
    if (!tokenString) return false;

    try {
      // Decode JWT payload (without verifying signature - backend will verify)
      const base64Url = tokenString.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));

      // Check expiration
      if (payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        return payload.exp > now;
      }

      return false;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  };

  /**
   * Login with JWT token and user data
   */
  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  /**
   * Logout - clear token and user data
   */
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Clear access cache
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('club_access_')) {
        sessionStorage.removeItem(key);
      }
    });
    setToken(null);
    setUser(null);
  };

  return {
    user,
    token,
    isAuthenticated: !!token && !!user && isTokenValid(),
    login,
    logout,
    isTokenValid: () => isTokenValid(),
  };
}
