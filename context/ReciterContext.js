import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create Reciter Context
const ReciterContext = createContext();

// Available reciters
export const RECITERS = [
  { id: 'alafasy', name: 'Mishary Rashid Alafasy', language: 'Arabic' },
  { id: 'abdulbasitmurattal', name: 'Abdul Basit Murattal', language: 'Arabic' },
  { id: 'abdurrahmaansudais', name: 'Abdurrahmaan As-Sudais', language: 'Arabic' },
  { id: 'ahmedajamy', name: 'Ahmed ibn Ali al-Ajamy', language: 'Arabic' },
  { id: 'hanirifai', name: 'Hani Rifai', language: 'Arabic' },
  { id: 'husary', name: 'Mahmoud Khalil Al-Husary', language: 'Arabic' },
  { id: 'husarymujawwad', name: 'Mahmoud Khalil Al-Husary (Mujawwad)', language: 'Arabic' },
  { id: 'mahermuaiqly', name: 'Maher Al Muaiqly', language: 'Arabic' },
  { id: 'minshawi', name: 'Mohamed Siddiq al-Minshawi', language: 'Arabic' },
  { id: 'minshawimujawwad', name: 'Mohamed Siddiq al-Minshawi (Mujawwad)', language: 'Arabic' },
  { id: 'muhammadayyoub', name: 'Muhammad Ayyoub', language: 'Arabic' },
  { id: 'muhammadjibreel', name: 'Muhammad Jibreel', language: 'Arabic' },
  { id: 'walk', name: 'Ibrahim Walk', language: 'English' },
];

// Fallback default reciter in case the array is corrupted
const DEFAULT_RECITER = { id: 'alafasy', name: 'Mishary Rashid Alafasy', language: 'Arabic' };

// Verify the reciters list to ensure it's valid
const verifyReciters = () => {
  // Check if RECITERS is an array and not empty
  if (!Array.isArray(RECITERS) || RECITERS.length === 0) {
    console.error("RECITERS list is invalid or empty");
    return [DEFAULT_RECITER];
  }
  
  // Check if first reciter has all required properties
  if (!RECITERS[0].id || !RECITERS[0].name) {
    console.error("RECITERS list contains invalid entries");
    return [DEFAULT_RECITER];
  }
  
  return RECITERS;
};

// Reciter provider component
export const ReciterProvider = ({ children }) => {
  // Verify the reciters list and use a safe version
  const safeReciters = verifyReciters();
  const [selectedReciter, setSelectedReciter] = useState(safeReciters[0]); 
  const [isLoading, setIsLoading] = useState(true);

  // Log the list of available reciters at startup
  useEffect(() => {
    console.log("Available reciters:", 
      safeReciters.map(r => `${r.name} (${r.id})`).join(', '));
  }, []);

  // Load saved reciter preference from AsyncStorage
  useEffect(() => {
    const loadReciterPreference = async () => {
      try {
        const savedReciterId = await AsyncStorage.getItem('reciterId');
        console.log("Loaded reciter ID from storage:", savedReciterId);
        
        if (savedReciterId) {
          // Find the reciter by ID
          const foundReciter = safeReciters.find(r => r.id === savedReciterId);
          
          // If found, set it as the selected reciter
          if (foundReciter) {
            console.log("Found matching reciter:", foundReciter.name);
            setSelectedReciter(foundReciter);
          } else {
            console.log("No matching reciter found for ID:", savedReciterId);
            // Default to first reciter if no match found
            setSelectedReciter(safeReciters[0]);
          }
        } else {
          console.log("No saved reciter ID, using default:", safeReciters[0].name);
        }
      } catch (error) {
        console.error("Error loading reciter preference:", error);
        // Default to first reciter on error
        setSelectedReciter(safeReciters[0]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadReciterPreference();
  }, []);

  // Change reciter and save to AsyncStorage
  const changeReciter = async (reciter) => {
    try {
      // Verify the reciter has a valid id
      if (!reciter || !reciter.id) {
        console.error("Attempted to select invalid reciter:", reciter);
        return;
      }
      
      console.log("Changing reciter to:", reciter.name, reciter.id);
      setSelectedReciter(reciter);
      await AsyncStorage.setItem('reciterId', reciter.id);
    } catch (error) {
      console.error("Error saving reciter preference:", error);
    }
  };

  const value = {
    selectedReciter, 
    changeReciter, 
    isLoading, 
    reciters: safeReciters
  };

  // Log the selected reciter for debugging
  useEffect(() => {
    console.log("Current selected reciter:", 
      selectedReciter ? `${selectedReciter.name} (${selectedReciter.id})` : "none");
  }, [selectedReciter]);

  return (
    <ReciterContext.Provider value={value}>
      {children}
    </ReciterContext.Provider>
  );
};

// Custom hook to use the reciter context
export const useReciter = () => {
  const context = useContext(ReciterContext);
  if (context === undefined) {
    throw new Error('useReciter must be used within a ReciterProvider');
  }
  return context;
}; 