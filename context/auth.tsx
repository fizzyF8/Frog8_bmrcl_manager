import { createContext, useContext, useState, useEffect } from 'react';
import { router } from 'expo-router';
import { authApi, UserProfile } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const refreshProfile = async () => {
    try {
      const response = await authApi.getProfile();
      if (response.status === 'true') {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Check for existing token and fetch profile on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
        await refreshProfile();
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      if (response.status === 'true') {
        // Store the token
        await AsyncStorage.setItem('token', response.token);
        setIsAuthenticated(true);
        // Fetch user profile after successful login
        await refreshProfile();
        router.replace('/(tabs)');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call the logout API
      await authApi.logout();
      // Clear the token from storage
      await AsyncStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, we should still clear local state
      await AsyncStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
      router.replace('/auth/login');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);