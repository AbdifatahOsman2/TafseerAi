import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as bookmarkService from '../services/bookmarkService';
import * as userActivityService from '../services/userActivityService';

// Create User Context
const UserContext = createContext();

// User provider component
export const UserProvider = ({ children }) => {
  // Hardcoded to unauthenticated guest state
  const user = null;
  const isAuthenticated = false;
  const isGuest = true;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Just mock a tiny loading delay to let the app initialize
    const init = async () => {
      setIsLoading(false);
    };
    init();
  }, []);

  // Stub methods to prevent crashes in components that still call them
  const login = async (userData) => {
    console.log("Login stub called - auth is disabled.");
  };

  const logout = async () => {
    console.log("Logout stub called - auth is disabled.");
  };

  const setGuestMode = async (isGuestMode = true) => {
    console.log("setGuestMode stub called - auth is disabled.");
  };

  const value = {
    user,
    isAuthenticated,
    isGuest,
    isLoading,
    login,
    logout,
    setGuestMode
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 