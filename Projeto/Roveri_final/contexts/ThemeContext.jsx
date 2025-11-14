import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Prefer stored theme; otherwise respect user system preference; default to 'light'
  const [theme, setTheme] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('theme');
        if (stored === 'light' || stored === 'dark') return stored;
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      }
    } catch (e) {
      // ignore
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const body = document.body;
      if (theme === 'dark') {
        root.classList.add('dark');
        body.classList.add('dark');
        try { root.setAttribute('data-theme', 'dark'); body.setAttribute('data-theme', 'dark'); } catch (e) {}
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
        try { root.setAttribute('data-theme', 'light'); body.setAttribute('data-theme', 'light'); } catch (e) {}
      }
      try {
        localStorage.setItem('theme', theme);
      } catch (e) {
        // ignore storage errors
      }
      // small debug aid: show current theme in console
      // you can remove this later
      // eslint-disable-next-line no-console
      console.debug('[Theme] applied theme=', theme, ' html.classes=', root.className);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
