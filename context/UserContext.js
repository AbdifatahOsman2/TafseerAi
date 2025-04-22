import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import * as bookmarkService from '../services/bookmarkService';
import * as userActivityService from '../services/userActivityService';

// Create User Context
const UserContext = createContext();

// User provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Setup Firebase Auth state listener
  useEffect(() => {
    // Load guest status from AsyncStorage first
    const loadGuestStatus = async () => {
      try {
        const guestStatus = await AsyncStorage.getItem('isGuest');
        if (guestStatus === 'true') {
          setIsGuest(true);
        }
      } catch (error) {
        // Error handling without console.log
      }
    };
    
    loadGuestStatus();
    
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'User',
          photoURL: user.photoURL
        });
        setIsAuthenticated(true);
        
        if (isGuest) {
          // If transitioning from guest to authenticated, migrate data
          await migrateGuestToUser(user.uid);
          setIsGuest(false);
          // Clear guest status in storage when we have a real user
          await AsyncStorage.setItem('isGuest', 'false');
        } else {
          // Track login activity
          await userActivityService.trackDailyActivity({uid: user.uid}, false);
          await userActivityService.trackUserLogin(user.uid);
        }
      } else {
        // User is signed out
        setUser(null);
        setIsAuthenticated(false);
        // Note: we don't change isGuest here, as it's managed separately
      }
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [isGuest]);

  // Helper function to migrate guest data to user account
  const migrateGuestToUser = async (userId) => {
    try {
      // Migrate bookmarks
      await bookmarkService.clearLocalBookmarks();
      
      // Migrate activity data
      await userActivityService.migrateGuestActivity(userId);
    } catch (error) {
      // Error handling without console.error
    }
  };

  // Login with user data
  const login = async (userData) => {
    // Clear local bookmarks when logging in (they'll be replaced with user's Firebase bookmarks)
    await bookmarkService.clearLocalBookmarks();
    
    setUser(userData);
    setIsAuthenticated(true);
    setIsGuest(false);
    await AsyncStorage.setItem('isGuest', 'false');
    
    // Track activity and login
    await userActivityService.trackDailyActivity(userData, false);
    await userActivityService.trackUserLogin(userData.uid);
  };

  // Logout user
  const logout = async () => {
    try {
      // Track logout before signing out
      if (user && user.uid) {
        await userActivityService.trackUserLogout(user.uid);
      }
      
      await signOut(auth);
      
      // Clear local bookmarks when logging out
      await bookmarkService.clearLocalBookmarks();
      
      setUser(null);
      setIsAuthenticated(false);
      setIsGuest(false);
      await AsyncStorage.setItem('isGuest', 'false');
      
      // We intentionally don't clear 'hasCompletedOnboarding' so users don't see onboarding again
    } catch (error) {
      // Error handling without console.error
    }
  };

  // Set guest mode
  const setGuestMode = async (isGuestMode = true) => {
    // Update the guest mode state based on parameter (true by default)
    setIsGuest(isGuestMode);
    
    // If turning on guest mode, make sure authentication is false
    if (isGuestMode) {
      // When entering guest mode, clear any existing bookmarks
      await bookmarkService.clearLocalBookmarks();
      
      setIsAuthenticated(false);
      setUser(null);
      
      // Track guest activity
      await userActivityService.trackDailyActivity(null, true);
    }
    
    // Store the guest mode status in AsyncStorage
    await AsyncStorage.setItem('isGuest', isGuestMode ? 'true' : 'false');
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