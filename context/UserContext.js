import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

// Create User Context
const UserContext = createContext();

// User provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth();

  // Setup Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'User',
            photoURL: firebaseUser.photoURL,
          };
          
          setUser(userData);
          setIsGuest(false);
          
          // Save to AsyncStorage for offline access
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
        } else {
          // Check if we have stored user data (for offline use)
          const storedUserData = await AsyncStorage.getItem('userData');
          
          if (storedUserData) {
            // Use stored user data when offline
            setUser(JSON.parse(storedUserData));
            setIsGuest(false);
          } else {
            // No user signed in and no stored data
            setUser(null);
            setIsGuest(true);
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
        setIsGuest(true);
      } finally {
        setIsLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Login function - now handled by Firebase Authentication in the Login/Register screens
  // This is kept for compatibility and to update the context state
  const login = async (userData) => {
    try {
      setUser(userData);
      setIsGuest(false);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  // Logout function - now also signs out from Firebase
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsGuest(true);
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Function to switch from guest mode to auth mode
  const exitGuestMode = () => {
    setIsGuest(false);
    setUser(null);
  };

  // Function to enable guest mode
  const setGuestMode = () => {
    setUser(null);
    setIsGuest(true);
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      isGuest, 
      isLoading, 
      login, 
      logout,
      exitGuestMode,
      setGuestMode
    }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 