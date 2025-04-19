import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create Reciter Context
const ReciterContext = createContext();

// Available reciters
export const RECITERS = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy', language: 'Arabic' },
  { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit Murattal', language: 'Arabic' },
  { id: 'ar.abdurrahmaansudais', name: 'Abdurrahmaan As-Sudais', language: 'Arabic' },
  { id: 'ar.ahmedajamy', name: 'Ahmed ibn Ali al-Ajamy', language: 'Arabic' },
  { id: 'ar.hanirifai', name: 'Hani Rifai', language: 'Arabic' },
  { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', language: 'Arabic' },
  { id: 'ar.husarymujawwad', name: 'Mahmoud Khalil Al-Husary (Mujawwad)', language: 'Arabic' },
  { id: 'ar.mahermuaiqly', name: 'Maher Al Muaiqly', language: 'Arabic' },
  { id: 'ar.minshawi', name: 'Mohamed Siddiq al-Minshawi', language: 'Arabic' },
  { id: 'ar.minshawimujawwad', name: 'Mohamed Siddiq al-Minshawi (Mujawwad)', language: 'Arabic' },
  { id: 'ar.muhammadayyoub', name: 'Muhammad Ayyoub', language: 'Arabic' },
  { id: 'ar.muhammadjibreel', name: 'Muhammad Jibreel', language: 'Arabic' },
  { id: 'en.walk', name: 'Ibrahim Walk', language: 'English' },
];

// Reciter provider component
export const ReciterProvider = ({ children }) => {
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0]); // Default to Alafasy
  const [isLoading, setIsLoading] = useState(true);

  // Load saved reciter preference from AsyncStorage
  useEffect(() => {
    const loadReciterPreference = async () => {
      try {
        const savedReciterId = await AsyncStorage.getItem('selectedReciter');
        if (savedReciterId !== null) {
          const savedReciter = RECITERS.find(r => r.id === savedReciterId);
          if (savedReciter) {
            setSelectedReciter(savedReciter);
          }
        }
      } catch (error) {
        console.error('Error loading reciter preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReciterPreference();
  }, []);

  // Change reciter and save to AsyncStorage
  const changeReciter = async (reciter) => {
    try {
      setSelectedReciter(reciter);
      await AsyncStorage.setItem('selectedReciter', reciter.id);
    } catch (error) {
      console.error('Error saving reciter preference:', error);
    }
  };

  return (
    <ReciterContext.Provider value={{ selectedReciter, changeReciter, isLoading, reciters: RECITERS }}>
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