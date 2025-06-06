import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile, updateUserProfile } from '../services/firestore';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadThemePreference = async () => {
      if (currentUser) {
        try {
          const userProfile = await getUserProfile(currentUser.uid);
          const darkMode = userProfile?.preferences?.darkMode || false;
          setIsDarkMode(darkMode);
          document.documentElement.classList.toggle('dark', darkMode);
        } catch (error) {
          console.error('Error loading theme preference:', error);
        }
      }
    };

    loadThemePreference();
  }, [currentUser]);

  const toggleDarkMode = async () => {
    try {
      const newDarkMode = !isDarkMode;
      setIsDarkMode(newDarkMode);
      document.documentElement.classList.toggle('dark', newDarkMode);

      if (currentUser) {
        await updateUserProfile(currentUser.uid, {
          preferences: {
            darkMode: newDarkMode
          }
        });
      }
    } catch (error) {
      console.error('Error toggling dark mode:', error);
      // Revert the change if there's an error
      setIsDarkMode(!isDarkMode);
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};