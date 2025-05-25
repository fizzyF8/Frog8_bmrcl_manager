import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'light' | 'dark';

export const lightTheme = {
  background: '#f9f6ee',
  card: '#FFFFFF',
  text: '#18181B',
  secondaryText: '#52525B',
  border: '#E5E7EB',
  primary: '#2563EB',
  error: '#EF4444',
  success: '#22C55E',
  // ...add more as needed
};

export const darkTheme = {
  background: '#18181B',
  card: '#23232A',
  text: '#F8F9FB',
  secondaryText: '#A1A1AA',
  border: '#27272A',
  primary: '#60A5FA',
  error: '#F87171',
  success: '#4ADE80',
  // ...add more as needed
};

const ThemeContext = createContext<{
  theme: typeof lightTheme;
  themeType: ThemeType;
  toggleTheme: () => void;
} | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeType, setThemeType] = useState<ThemeType>('light');

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('themeType');
      if (stored === 'dark' || stored === 'light') setThemeType(stored);
    })();
  }, []);

  const toggleTheme = async () => {
    const next = themeType === 'light' ? 'dark' : 'light';
    setThemeType(next);
    await AsyncStorage.setItem('themeType', next);
  };

  const theme = themeType === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeType, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}; 