import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useBroadcastChannel } from '../hooks/useBroadcastChannel';

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme';
const THEME_CHANNEL_NAME = 'theme-channel';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Sync with other open browser tabs
  const handleBroadcastMessage = useCallback((incomingTheme: Theme) => {
    if (incomingTheme === 'light' || incomingTheme === 'dark') {
      setThemeState(incomingTheme);
    }
  }, []);

  const { postMessage } = useBroadcastChannel<Theme>(THEME_CHANNEL_NAME, handleBroadcastMessage);

  // Apply theme to DOM and persist in localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  }, [theme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState((prev) => {
        if (prev === newTheme) return prev;
        postMessage(newTheme);
        return newTheme;
      });
    },
    [postMessage]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      postMessage(nextTheme);
      return nextTheme;
    });
  }, [postMessage]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;

