import { createContext, useContext, useState, useEffect } from 'react';
import { colors, shadows, defaultTheme } from '../constants/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || defaultTheme;
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  // Theme ke according colors return karo
  const getColor = (path) => {
    return path.split('.').reduce((obj, key) => obj[key], colors[theme]);
  };

  // Shadow style return karo
  const getShadow = (type) => {
    return shadows[type](theme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      colors: colors[theme],
      getColor,
      getShadow
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};