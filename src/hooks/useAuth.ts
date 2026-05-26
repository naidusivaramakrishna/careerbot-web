import { useEffect, useState, useCallback } from 'react';
import { isAuthenticated, signOut } from '@/api/authApi';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await isAuthenticated();
        setAuthenticated(result);
      } catch (error) {
        setAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut();
      setAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
      setAuthenticated(false);
    }
  }, []);

  return {
    isAuthenticated: authenticated,
    isLoading,
    logout,
  };
}
