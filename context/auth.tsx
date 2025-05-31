import { createContext, useContext, useState, useEffect } from 'react';
import { router } from 'expo-router';
import { authApi, UserProfile } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshProfile = async (): Promise<void> => {
    try {
      const response = await authApi.getProfile();
      if (response.status === 'true') {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          try {
            await refreshProfile();
            if (mounted) {
              setIsAuthenticated(true);
            }
          } catch (error) {
            if (mounted) {
              await AsyncStorage.removeItem('token');
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        } else if (mounted) {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        if (mounted) {
          setError(error instanceof Error ? error : new Error('Failed to initialize auth'));
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        if (mounted) {
          if (Platform.OS === 'ios') {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          setIsLoading(false);
        }
      }
    }

    // Add a small delay for iOS
    const timer = setTimeout(() => {
      initialize();
    }, Platform.OS === 'ios' ? 500 : 0);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(email, password);
      if (response.status === 'true') {
        await AsyncStorage.setItem('token', response.token);
        try {
          await refreshProfile();
          setIsAuthenticated(true);
          router.replace('/(tabs)');
        } catch (error) {
          throw new Error('Failed to fetch user profile');
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
      router.replace('/auth/login');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);