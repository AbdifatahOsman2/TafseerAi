import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, DARK_COLORS } from '../constants/colors';

// Create Theme Context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [theme, setTheme] = useState(DARK_COLORS); // Default to dark colors
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
          setTheme(savedTheme === 'dark' ? DARK_COLORS : COLORS);
        } else {
          // No saved preference, use dark mode as default
          await AsyncStorage.setItem('theme', 'dark');
          setIsDarkMode(true);
          setTheme(DARK_COLORS);
        }
      } catch (error) {
        // Error handling without console.error
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Toggle between light and dark theme
  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    setTheme(newMode ? DARK_COLORS : COLORS);
    
    try {
      await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
    } catch (error) {
      // Error handling without console.error
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 