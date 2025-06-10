import React, { createContext, useContext, useState } from 'react';

type Theme = {
  mode: 'light' | 'dark';
  background: string;
  card: string;
  text: string;
  subtitle: string;
  border: string;
  primary: string;
};

const lightTheme: Theme = {
  mode: 'light',
  background: '#f7f8fa',
  card: '#fff',
  text: '#1f2937',
  subtitle: '#666',
  border: '#e5e5e5',
  primary: '#3b82f6',
};

const darkTheme: Theme = {
  mode: 'dark',
  background: '#18181b',
  card: '#23232a',
  text: '#fff',
  subtitle: '#bbb',
  border: '#333',
  primary: '#3b82f6',
};

type ThemeContextType = {
  theme: Theme;
  setThemeMode: (mode: 'light' | 'dark') => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  setThemeMode: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(lightTheme);

  const setThemeMode = (mode: 'light' | 'dark') => {
    setTheme(mode === 'dark' ? darkTheme : lightTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider; 