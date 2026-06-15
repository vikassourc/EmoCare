import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api';

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  
  // Default to user preference or zinc if none
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('emocare_theme') || user?.preferences?.theme || 'zinc';
  });

  useEffect(() => {
    // If user logs in and has a theme preference saved in DB, use it
    if (user?.preferences?.theme && !localStorage.getItem('emocare_theme')) {
      setThemeState(user.preferences.theme);
    }
  }, [user]);

  useEffect(() => {
    // Apply class to HTML root
    const root = document.documentElement;
    root.classList.remove('theme-zinc', 'theme-ocean', 'theme-forest', 'theme-sunset');
    if (theme !== 'zinc') {
      root.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('emocare_theme', theme);
  }, [theme]);

  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    // Optimistically save to backend if user is logged in
    if (user) {
      try {
        await api.updateProfile({ preferences: { theme: newTheme } });
        // Update local user object
        const updatedUser = { ...user, preferences: { ...user.preferences, theme: newTheme } };
        localStorage.setItem('emocare_user', JSON.stringify(updatedUser));
      } catch (err) {
        console.error('Failed to save theme to backend', err);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
