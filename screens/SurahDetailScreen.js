import React, { useState, useEffect, useRef, createRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Dimensions,
  Modal,
  Alert,
  findNodeHandle,
  PanResponder,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useReciter } from '../context/ReciterContext';
import { fetchClassicalTafseer } from '../services/tafseerService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as bookmarkService from '../services/bookmarkService';
import { useUser } from '../context/UserContext';

const { width, height } = Dimensions.get('window');

const SurahDetailScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { surahNumber, surah, scrollToAyah } = route.params;
  const { selectedReciter } = useReciter();
  const { user, isGuest } = useUser();
  const [surahContent, setSurahContent] = useState(null);
  const [translations, setTranslations] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const [selectedAyah, setSelectedAyah] = useState(null);
  const [showBismillah, setShowBismillah] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef(null);
  const [isSurahPlaying, setIsSurahPlaying] = useState(false);
  const [isSurahLoading, setIsSurahLoading] = useState(false);
  const surahSoundRef = useRef(null);
  const [currentAyahPlaying, setCurrentAyahPlaying] = useState(0);
  const [ayahsToPlay, setAyahsToPlay] = useState([]);
  const scrollViewRef = useRef(null);
  const ayahRefs = useRef({});
  // Flag to track if we need to scroll to an ayah after content loads
  const [shouldScrollToAyah, setShouldScrollToAyah] = useState(scrollToAyah ? true : false);
  const [isTafseerLoading, setIsTafseerLoading] = useState(false);

  // Modal animation states
  const slideAnim = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  
  // PanResponder for slide-down gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only handle vertical swipes
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 3);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward movement (positive dy)
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If dragged down more than 100px or with velocity > 0.3, close the modal
        if (gestureState.dy > 100 || gestureState.vy > 0.3) {
          closeMenu();
        } else {
          // Otherwise, spring back to original position
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Define Bismillah text for display purposes
  const BISMILLAH = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ";

  // Format reciter ID for API URLs
  const formatReciterId = (reciterId) => {
    // Add 'ar.' prefix if needed and handle null cases
    if (!reciterId) return 'ar.alafasy'; // Default fallback

    // If ID already has language prefix, return as is
    if (reciterId.includes('.')) return reciterId;

    // For English reciter 'walk'
    if (reciterId === 'walk') return 'en.walk';
    
    // For Arabic reciters
    return `ar.${reciterId}`;
  };

  // Safe reciter ID that will always have a valid value
  const reciterId = selectedReciter?.id || 'alafasy'; // Default to Alafasy if ID is missing

  // Log available reciter information
  useEffect(() => {
    console.log("SurahDetailScreen - Reciter info:", 
      selectedReciter ? `${selectedReciter.name} (${selectedReciter.id})` : "none", 
      "Formatted ID:", formatReciterId(reciterId));
  }, [selectedReciter]);

  useEffect(() => {
    fetchSurahContent(surahNumber);
    
    // Initialize audio with more detailed error handling
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log("Audio mode set successfully");
      } catch (error) {
        console.error("Error setting audio mode:", error);
        Alert.alert(
          "Audio Setup Error", 
          "There was a problem initializing the audio. Please restart the app."
        );
      }
    };
    
    setupAudio();
    
    // Cleanup function to unload sound when component unmounts
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (surahSoundRef.current) {
        surahSoundRef.current.unloadAsync();
      }
    };
  }, [surahNumber]);

  // Effect to scroll to a specific ayah if requested
  useEffect(() => {
    if (!loading && shouldScrollToAyah && scrollToAyah && surahContent) {
      // Use a longer delay to ensure all ayahs are rendered and measured
      const timer = setTimeout(() => {
        scrollToAyahNumber(parseInt(scrollToAyah, 10));
        // Reset the flag to avoid scrolling again
        setShouldScrollToAyah(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [loading, shouldScrollToAyah, scrollToAyah, surahContent]);

  // Function to scroll to a specific ayah
  const scrollToAyahNumber = (ayahNumber) => {
    // Ensure ayahNumber is a number
    const ayahNum = parseInt(ayahNumber, 10);
    
    if (isNaN(ayahNum)) {
      return;
    }
    
    if (ayahRefs.current[ayahNum] && scrollViewRef.current) {
      // Get the y position and scroll with extra offset for the header
      const yPosition = ayahRefs.current[ayahNum];
      
      scrollViewRef.current.scrollTo({
        y: yPosition - 70, // Subtract header height for better positioning
        animated: true,
      });
      
      // Flash the ayah
      highlightAyah(ayahNum);
    } else {
      // Fallback: if we can't find the exact ayah, try scrolling to an approximate position
      if (surahContent && surahContent.ayahs) {
        const totalAyahs = surahContent.numberOfAyahs;
        const scrollPosition = (ayahNum / totalAyahs) * 5000; // Rough estimate
        
        scrollViewRef.current?.scrollTo({
          y: scrollPosition,
          animated: true,
        });
      }
    }
  };

  // Function to highlight an ayah briefly
  const highlightAyah = (ayahNumber) => {
    // Find the ayah object
    const targetAyah = surahContent?.ayahs?.find(a => a.numberInSurah === ayahNumber);
    if (targetAyah) {
      // Flash the ayah by briefly selecting it
      setSelectedAyah(targetAyah);
      
      // Then close the modal after a short delay
      setTimeout(() => {
        setSelectedAyah(null);
      }, 800);
    }
  };

  // Function to measure and store the ayah position
  const measureAyahPosition = (ayahNumber, y) => {
    // Ensure ayahNumber is stored as a number
    const ayahNum = parseInt(ayahNumber, 10);
    ayahRefs.current[ayahNum] = y;
    
    // If this is the ayah we need to scroll to and we haven't scrolled yet, do it now
    if (shouldScrollToAyah && scrollToAyah && parseInt(scrollToAyah, 10) === ayahNum) {
      // Add a small delay to ensure measurement is complete
      setTimeout(() => {
        scrollToAyahNumber(ayahNum);
        setShouldScrollToAyah(false);
      }, 100);
    }
  };

  const fetchSurahContent = async (number) => {
    setLoading(true);
    try {
      // Fetch both the Arabic text and English translation in parallel
      const [arabicResponse, translationResponse] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${number}`),
        fetch(`https://api.alquran.cloud/v1/surah/${number}/en.hilali`)
      ]);
      
      const arabicData = await arabicResponse.json();
      const translationData = await translationResponse.json();
      
      if (arabicData.code === 200 && translationData.code === 200) {
        // Special case for Surah numbers
        const shouldDisplayBismillah = number !== 1 && number !== 9;
        
        // Process the data to handle Bismillah correctly
        let processedArabicData = { ...arabicData.data };
        let processedTranslationData = { ...translationData.data };
        
        // Add the surah number to each ayah
        if (processedArabicData.ayahs && processedArabicData.ayahs.length > 0) {
          processedArabicData.ayahs = processedArabicData.ayahs.map(ayah => ({
            ...ayah,
            surah: number  // Add the surah number to each ayah
          }));
        }
        
        // Don't modify Al-Fatiha or At-Tawbah
        if (number !== 1 && number !== 9 && processedArabicData.ayahs && processedArabicData.ayahs.length > 0) {
          // First, print the original text for debugging
          const firstAyah = processedArabicData.ayahs[0];
          
          // Get the first ayah text
          let ayahText = firstAyah.text;
          
          // Store common Arabic starting words for various surahs
          const startPatterns = {
            114: "قُلۡ", // An-Naas starts with "Qul"
            113: "قُلۡ", // Al-Falaq starts with "Qul"
            112: "قُلۡ", // Al-Ikhlas starts with "Qul"
            109: "قُلۡ", // Al-Kafirun starts with "Qul"
            108: "إِنَّآ", // Al-Kawthar starts with "Inna"
            107: "أَرَءَیۡتَ", // Al-Ma'un starts with "Ara'ayta"
            106: "لِإِیلَـٰفِ", // Quraysh starts with "Li'ilafi"
            105: "أَلَمۡ", // Al-Fil starts with "Alam"
            104: "وَیۡلࣱ", // Al-Humazah starts with "Waylun"
            103: "وَٱلۡعَصۡرِ", // Al-Asr starts with "Wal-asr"
            // Add more patterns for other surahs as needed
          };
          
          // First, try special case for specific surahs that we know the pattern for
          if (startPatterns[number]) {
            const startPattern = startPatterns[number];
            
            if (ayahText.includes(startPattern)) {
              const patternIndex = ayahText.indexOf(startPattern);
              
              // Only use this if the pattern is found after some initial text (Bismillah)
              if (patternIndex > 20) {
                const cleanText = ayahText.substring(patternIndex).trim();
                processedArabicData.ayahs[0].text = cleanText;
              }
            }
          }
          // Next, try general pattern-based approach
          else if (ayahText.startsWith('ب')) {
            // Find the position after Bismillah by looking for a clear break
            // Bismillah is typically followed by a space or other character
            let cutPosition = ayahText.indexOf(' ', 35); // Look for space after around 35-40 chars
            
            if (cutPosition === -1) {
              // If we can't find a space, try another approach - just remove first 40 chars
              // for surahs where Bismillah is directly followed by the ayah
              const cleanText = ayahText.substring(40).trim();
              processedArabicData.ayahs[0].text = cleanText;
            } else {
              // We found a good cut position
              const cleanText = ayahText.substring(cutPosition + 1).trim();
              processedArabicData.ayahs[0].text = cleanText;
            }
          }
          
          // Clean the translation too - most translations have "In the Name of Allah..." at start
          if (processedTranslationData.ayahs && processedTranslationData.ayahs.length > 0) {
            const transText = processedTranslationData.ayahs[0].text;
            
            if (transText.includes("In the Name of Allah") || transText.includes("In the name of Allah")) {
              // Find the end of the Bismillah phrase by looking for "Merciful"
              const mercifulPos = transText.indexOf("Merciful");
              
              if (mercifulPos !== -1) {
                // Take text after "Merciful" + some chars for the period
                const cleanText = transText.substring(mercifulPos + 10).trim();
                
                // Capitalize first letter
                if (cleanText.length > 0) {
                  const finalText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
                  processedTranslationData.ayahs[0].text = finalText;
                }
              }
            }
          }
        }
        
        setSurahContent(processedArabicData);
        setTranslations(processedTranslationData);
        setShowBismillah(shouldDisplayBismillah);
      }
    } catch (error) {
      // Error handling without console.error
    } finally {
      setLoading(false);
    }
  };

  // Function to play ayah audio with improved error handling
  const playAyahAudio = async (ayah) => {
    try {
      setIsLoading(true);
      
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      // Format the formatted reciter ID for the URL
      const formattedReciterId = formatReciterId(reciterId);
      
      console.log(`Playing ayah ${ayah.number} with reciter ${formattedReciterId}`);
      
      // Set up multiple URL formats to try
      const urls = [
        // Primary API URL
        `https://api.alquran.cloud/v1/ayah/${ayah.number}/${formattedReciterId}`,
        // Direct CDN URL with bitrate
        `https://cdn.islamic.network/quran/audio/128/${formattedReciterId}/${ayah.number}.mp3`,
        // Direct CDN URL without bitrate
        `https://cdn.islamic.network/quran/audio/${formattedReciterId}/${ayah.number}.mp3`,
        // Alquran.cloud format
        `https://cdn.alquran.cloud/media/audio/ayah/${formattedReciterId}/${ayah.number}`
      ];
      
      console.log('Trying ayah URLs:', urls);
      
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      
      // Try each URL in sequence until one works
      let success = false;
      let error = null;
      
      for (let i = 0; i < urls.length; i++) {
        try {
          const url = urls[i];
          console.log(`Attempting to play ayah from: ${url}`);
          
          // If it's an API URL, fetch the actual audio URL first
          if (url.includes('/v1/ayah/')) {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.code === 200 && data.data && data.data.audio) {
              const audioUrl = data.data.audio;
              console.log("Successfully got ayah audio URL:", audioUrl);
              
              const { sound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: true },
                status => {
                  if (status.didJustFinish) {
                    setIsPlaying(false);
                    setIsLoading(false);
                  }
                }
              );
              
              soundRef.current = sound;
              setIsPlaying(true);
              success = true;
              break;
            }
          } else {
            // Direct audio URL
            const { sound } = await Audio.Sound.createAsync(
              { uri: url },
              { shouldPlay: true },
              status => {
                if (status.didJustFinish) {
                  setIsPlaying(false);
                  setIsLoading(false);
                }
              }
            );
            
            soundRef.current = sound;
            setIsPlaying(true);
            success = true;
            break;
          }
        } catch (urlError) {
          console.log(`Error with ayah URL ${urls[i]}:`, urlError);
          error = urlError;
          // Continue to the next URL
        }
      }
      
      if (!success) {
        throw error || new Error('All ayah audio sources failed');
      }
    } catch (error) {
      console.error("Final error in playAyahAudio:", error);
      Alert.alert(
        'Audio Playback Error', 
        `Unable to play ayah audio with the selected reciter (${reciterId}). Please try another reciter or check your internet connection.`
      );
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to play the next ayah in the queue
  const playNextAyah = async () => {
    if (!surahContent || !surahContent.ayahs || currentAyahPlaying === null) return;
    
    const nextAyahIndex = currentAyahPlaying + 1;
    if (nextAyahIndex >= surahContent.ayahs.length) {
      console.log('End of surah reached');
      setIsPlaying(false);
      setCurrentAyahPlaying(null);
      return;
    }
    
    const nextAyah = surahContent.ayahs[nextAyahIndex];
    const nextAyahNumber = nextAyah.number;
    
    try {
      setIsLoading(true);
      
      // Format the reciter ID for the URL
      const formattedReciterId = formatReciterId(reciterId);
      
      console.log(`Playing next ayah ${nextAyahNumber} with reciter ${formattedReciterId}`);
      
      // Set up multiple URL formats to try
      const urls = [
        // Primary API URL
        `https://api.alquran.cloud/v1/ayah/${nextAyahNumber}/${formattedReciterId}`,
        // Direct CDN URL with bitrate
        `https://cdn.islamic.network/quran/audio/128/${formattedReciterId}/${nextAyahNumber}.mp3`,
        // Direct CDN URL without bitrate
        `https://cdn.islamic.network/quran/audio/${formattedReciterId}/${nextAyahNumber}.mp3`,
        // Alquran.cloud format
        `https://cdn.alquran.cloud/media/audio/ayah/${formattedReciterId}/${nextAyahNumber}`
      ];
      
      console.log('Trying next ayah URLs:', urls);
      
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      // Try each URL in sequence until one works
      let success = false;
      
      for (let i = 0; i < urls.length; i++) {
        try {
          const url = urls[i];
          console.log(`Attempting to play next ayah from: ${url}`);
          
          // If it's an API URL, fetch the actual audio URL first
          if (url.includes('/v1/ayah/')) {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.code === 200 && data.data && data.data.audio) {
              const audioUrl = data.data.audio;
              console.log("Successfully got next ayah audio URL:", audioUrl);
              
              const { sound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: true },
                (status) => {
                  if (status.didJustFinish) {
                    if (isPlaying) {
                      playNextAyah();
                    }
                  }
                }
              );
              
              soundRef.current = sound;
              setCurrentAyahPlaying(nextAyahIndex);
              setSelectedAyah(nextAyah);
              success = true;
              break;
            }
          } else {
            // Direct audio URL
            const { sound } = await Audio.Sound.createAsync(
              { uri: url },
              { shouldPlay: true },
              (status) => {
                if (status.didJustFinish) {
                  if (isPlaying) {
                    playNextAyah();
                  }
                }
              }
            );
            
            soundRef.current = sound;
            setCurrentAyahPlaying(nextAyahIndex);
            setSelectedAyah(nextAyah);
            success = true;
            break;
          }
        } catch (urlError) {
          console.log(`Error with next ayah URL ${urls[i]}:`, urlError);
          // Continue to the next URL
        }
      }
      
      if (!success) {
        throw new Error('All next ayah audio sources failed');
      }
      
    } catch (error) {
      console.error('Error playing next ayah:', error);
      Alert.alert(
        'Audio Playback Error',
        `Unable to play sequence with the selected reciter (${reciterId}). Please try another reciter.`
      );
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Watch for changes to currentAyahPlaying to play the next ayah in sequence
  useEffect(() => {
    // Only respond to changes when sequential surah playback is active
    if (isSurahPlaying && currentAyahPlaying > 0 && currentAyahPlaying < surahContent?.ayahs?.length) {
      console.log("Triggering play of next ayah:", currentAyahPlaying);
      
      // Play the next ayah in the sequence
      const nextAyah = surahContent.ayahs[currentAyahPlaying];
      
      // Auto-scroll to the current ayah if we have its position
      if (scrollViewRef.current && ayahRefs.current[nextAyah.numberInSurah]) {
        scrollViewRef.current.scrollTo({
          y: ayahRefs.current[nextAyah.numberInSurah] - 150, // Adjust for header
          animated: true
        });
      }
      
      // Slight delay to ensure previous sound is properly unloaded
      setTimeout(() => {
        playAyahInSequence(nextAyah).catch(error => {
          console.error("Failed to play next ayah in sequence:", error);
          // If we fail to play this ayah, try moving to the next one
          if (currentAyahPlaying + 1 < surahContent.ayahs.length) {
            setCurrentAyahPlaying(currentAyahPlaying + 1);
          } else {
            // End of surah or too many failures
            setIsSurahPlaying(false);
            setCurrentAyahPlaying(0);
            setAyahsToPlay([]);
          }
        });
      }, 300);
    }
  }, [currentAyahPlaying, isSurahPlaying]);

  // Function to stop playing
  const stopAyahAudio = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (error) {
        // Just reset the UI state and ignore the error
      }
    }
    setIsPlaying(false);
  };

  // Function to play entire surah audio with improved error handling
  const playSurahAudio = async () => {
    if (!surahContent || !surahContent.ayahs) return;
    
    try {
      setIsSurahLoading(true);
      
      // Format the reciter ID for the URL
      const formattedReciterId = formatReciterId(reciterId);
      
      console.log(`Playing surah ${surahNumber} with reciter ${formattedReciterId} using sequential ayah playback`);
      
      // Setup ayah-by-ayah playback for all reciters
      const allAyahs = surahContent.ayahs;
      setAyahsToPlay([...allAyahs]);
      
      // Reset currentAyahPlaying to start with first ayah
      setCurrentAyahPlaying(0);
      
      // Give a slight delay before starting the sequence
      setTimeout(async () => {
        try {
          // Play the first ayah
          if (allAyahs && allAyahs.length > 0) {
            const firstAyah = allAyahs[0];
            await playAyahInSequence(firstAyah);
            // After first ayah is playing, increment the counter to trigger the next ayah
            setCurrentAyahPlaying(1);
            setIsSurahPlaying(true);
          }
        } catch (sequenceError) {
          console.log("Error starting ayah sequence:", sequenceError);
          Alert.alert(
            'Audio Error',
            `Unable to play audio with the selected reciter (${reciterId}). Please try another reciter or check your internet connection.`
          );
          setIsSurahPlaying(false);
        }
      }, 300);
      
    } catch (error) {
      console.error('Error in playSurahAudio:', error);
      setIsSurahPlaying(false);
      Alert.alert(
        'Audio Error',
        `Unable to play audio with the selected reciter (${reciterId}). Please try another reciter or check your internet connection.`
      );
    } finally {
      setIsSurahLoading(false);
    }
  };

  // Helper function to play an ayah when in sequence mode
  const playAyahInSequence = async (ayah) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      // Format the reciter ID for the URL
      const formattedReciterId = formatReciterId(reciterId);
      
      // Setup multiple URL formats to try
      const urls = [
        // Primary API URL
        `https://api.alquran.cloud/v1/ayah/${ayah.number}/${formattedReciterId}`,
        // Direct CDN URL with bitrate
        `https://cdn.islamic.network/quran/audio/128/${formattedReciterId}/${ayah.number}.mp3`,
        // Direct CDN URL without bitrate
        `https://cdn.islamic.network/quran/audio/${formattedReciterId}/${ayah.number}.mp3`,
        // Alquran.cloud format
        `https://cdn.alquran.cloud/media/audio/ayah/${formattedReciterId}/${ayah.number}`
      ];
      
      console.log(`Playing ayah ${ayah.numberInSurah} in sequence`);
      
      // Try each URL in sequence until one works
      let success = false;
      
      for (let i = 0; i < urls.length; i++) {
        try {
          const url = urls[i];
          
          // If it's an API URL, fetch the actual audio URL first
          if (url.includes('/v1/ayah/')) {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.code === 200 && data.data && data.data.audio) {
              const audioUrl = data.data.audio;
              
              const { sound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: true },
                onPlaybackStatusUpdate
              );
              
              soundRef.current = sound;
              success = true;
              break;
            }
          } else {
            // Direct audio URL
            const { sound } = await Audio.Sound.createAsync(
              { uri: url },
              { shouldPlay: true },
              onPlaybackStatusUpdate
            );
            
            soundRef.current = sound;
            success = true;
            break;
          }
        } catch (urlError) {
          // Continue to the next URL
        }
      }
      
      if (!success) {
        throw new Error(`Failed to play ayah ${ayah.numberInSurah} in sequence`);
      }
    } catch (error) {
      console.error('Error in playAyahInSequence:', error);
      throw error;
    }
  };

  // Function to handle playback status updates
  const onPlaybackStatusUpdate = (status) => {
    if (status.didJustFinish && isSurahPlaying) {
      console.log("Ayah finished, moving to next one. Current index:", currentAyahPlaying);
      
      // Move to the next ayah
      const nextAyahIndex = currentAyahPlaying + 1;
      
      if (nextAyahIndex < surahContent?.ayahs?.length) {
        // Set the current ayah index which will trigger the useEffect to play the next ayah
        setCurrentAyahPlaying(nextAyahIndex);
      } else {
        // End of surah reached
        console.log("End of surah reached");
        setIsSurahPlaying(false);
        setCurrentAyahPlaying(0);
        setAyahsToPlay([]);
      }
    }
  };

  const stopSurahAudio = async () => {
    try {
      // Stop the full surah audio if it's playing
      if (surahSoundRef.current) {
        await surahSoundRef.current.stopAsync();
        await surahSoundRef.current.unloadAsync();
        surahSoundRef.current = null;
      }
      
      // Also stop any sequential ayah audio that might be playing
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      
      setIsSurahPlaying(false);
      setCurrentAyahPlaying(0);
      setAyahsToPlay([]);
    } catch (error) {
      console.error('Error stopping surah audio:', error);
    }
  };

  const handlePress = (ayah) => {
    showMenu(ayah);
  };

  const closeMenu = () => {
    // Animate the modal closing
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height, // Use screen height for more natural feeling
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset values for next opening
      slideAnim.setValue(height);
      // Clear states
      setSelectedAyah(null);
      setShowClassicalTafseer(false);
    });
  };

  const showMenu = (ayah) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAyah(ayah);
    
    // Reset animation values before animating
    slideAnim.setValue(height);
    modalOpacity.setValue(0);
    
    // Animate the modal opening
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBookmark = async (ayah) => {
    try {
      // Find matching translation
      const translation = translations?.ayahs.find(t => 
        t.numberInSurah === ayah.numberInSurah
      );
      
      // Add the surah info to the bookmark
      const bookmark = {
        ayah: {
          ...ayah,
          text: ayah.text,
          translation: translation ? translation.text : null,
        },
        surah: {
          name: surahContent.name,
          englishName: surahContent.englishName,
          number: surahContent.number,
        },
        timestamp: new Date().toISOString(),
      };
      
      // Check if this ayah is already bookmarked
      const isAlreadyBookmarked = await bookmarkService.isBookmarked(
        ayah, 
        surahContent.number, 
        user, 
        isGuest
      );
      
      let success;
      
      if (isAlreadyBookmarked) {
        // Remove from bookmarks if already exists
        success = await bookmarkService.removeBookmark(bookmark, user, isGuest);
        if (success) {
          Alert.alert('Bookmark Removed', 'Ayah has been removed from your bookmarks.');
        }
      } else {
        // Add to bookmarks
        success = await bookmarkService.saveBookmark(bookmark, user, isGuest);
        if (success) {
          Alert.alert('Bookmark Added', 'Ayah has been added to your bookmarks.');
        }
      }
      
      if (!success) {
        throw new Error('Failed to update bookmark');
      }
      
      // Close the menu
      closeMenu();
    } catch (error) {
      // Error handling without console.error
      Alert.alert('Error', 'Failed to update bookmarks. Please try again.');
    }
  };

  const handleClassicalTafseerToggle = async () => {
    // If we're showing tafseer and user taps, just hide it
    if (showClassicalTafseer) {
      setShowClassicalTafseer(false);
      return;
    }
    
    // Otherwise, fetch and show tafseer
    if (!selectedAyah) return;
    
    setIsTafseerLoading(true);
    
    try {
      // Get the surah number from either the ayah or route params
      const surahNum = selectedAyah.surah || surahNumber;
      const ayahNum = selectedAyah.numberInSurah;
      
      // Make sure we have the needed parameters
      if (!surahNum || !ayahNum) {
        console.log('Missing required tafseer parameters:', { 
          selectedAyah, 
          surahNum, 
          ayahNum,
          surahNumber 
        });
        throw new Error('Invalid ayah data');
      }
      
      console.log(`Fetching tafseer for Surah ${surahNum}, Ayah ${ayahNum}`);
      
      // Try to fetch classical tafseer with appropriate parameters
      const tafseerText = await fetchClassicalTafseer(surahNum, ayahNum);
      
      if (!tafseerText || tafseerText.trim() === '') {
        // If no tafseer text is returned, set a helpful message
        setClassicalTafseerContent("Classical tafseer is not available for this specific verse. Try using the AI-powered tafseer instead, or choose a different verse.");
      } else {
        // Set the tafseer content
        setClassicalTafseerContent(tafseerText);
      }
      
      // Show classical tafseer
      setShowClassicalTafseer(true);
    } catch (error) {
      console.log('Error fetching tafseer:', error);
      Alert.alert('Error', 'Failed to fetch tafseer. Please check your connection and try again.');
    } finally {
      setIsTafseerLoading(false);
    }
  };

  // Function to handle the "Chat with AI" button
  const handleAiTafseer = (ayah) => {
    try {
      if (!ayah) return;
      
      // Get the translation for this ayah
      const translation = translations?.ayahs.find(
        t => t.numberInSurah === ayah.numberInSurah
      );
      
      // Get the surah info for navigation
      const surahInfo = {
        name: surahContent.name,
        englishName: surahContent.englishName,
        number: surahNumber,
        ayah: {
          number: ayah.number,
          numberInSurah: ayah.numberInSurah,
          text: ayah.text,
          translation: translation ? translation.text : null
        }
      };
      
      // Close the modal
      closeMenu();
      
      // Prepare the initial question about this surah and ayah
      const initialQuestion = `Tell me more about Surah ${surahNumber} and Ayah ${ayah.numberInSurah}.`;
      
      // Navigate to the Tafseer screen with the ayah context and initial question
      navigation.navigate('Tafseer', { 
        surahContext: surahInfo,
        initialQuestion: initialQuestion
      });
    } catch (error) {
      console.log('Error navigating to AI chat:', error);
      Alert.alert('Error', 'Could not open AI chat. Please try again.');
    }
  };

  // Tafseer states
  const [showClassicalTafseer, setShowClassicalTafseer] = useState(false);
  const [classicalTafseerContent, setClassicalTafseerContent] = useState('');

  // useEffect for initializing animations when component mounts
  useEffect(() => {
    // Initialize animation values
    slideAnim.setValue(height); // Start from below the screen
    modalOpacity.setValue(0); // Start fully transparent
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.BACKGROUND }]}>
        <ActivityIndicator size="large" color={theme.PRIMARY} />
        <Text style={[styles.loadingText, { color: theme.TEXT_SECONDARY }]}>Loading Surah Content...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND }]}>
      <StatusBar barStyle={theme.DARK ? "light-content" : "dark-content"} />
      
      <View style={styles.compactHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={theme.TEXT_PRIMARY} 
          />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: theme.TEXT_PRIMARY }]}>
            {surahContent.name}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.TEXT_SECONDARY }]}>
            {surahContent.englishName}
          </Text>
          <Text style={[styles.reciterName, { color: theme.TEXT_TERTIARY }]}>
            Reciter: {selectedReciter?.name?.split(' ')[0] || 'Alafasy'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.playButton}
          onPress={() => isSurahPlaying ? stopSurahAudio() : playSurahAudio()}
          disabled={isSurahLoading}
        >
          {isSurahLoading ? (
            <ActivityIndicator size="small" color={theme.PRIMARY} />
          ) : (
            <MaterialCommunityIcons 
              name={isSurahPlaying ? "pause-circle" : "play-circle"} 
              size={28} 
              color={theme.PRIMARY} 
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.surahInfo}>
          <Text style={[styles.surahInfoText, { color: theme.TEXT_SECONDARY }]}>
            {surahContent.englishNameTranslation} • {surahContent.revelationType} • {surahContent.numberOfAyahs} Ayahs
          </Text>
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.BORDER }]} />
        
        {/* Bismillah header for all surahs except Surah 1 (Al-Fatiha) and Surah 9 (At-Tawbah) */}
        {showBismillah && (
          <View style={styles.bismillahContainer}>
            <Text style={[styles.bismillahText, { color: theme.TEXT_PRIMARY }]}>
              {BISMILLAH}
            </Text>
          </View>
        )}
        
        {surahContent.ayahs.map((ayah) => {
          // Find matching translation by numberInSurah
          const translation = translations?.ayahs.find(t => t.numberInSurah === ayah.numberInSurah);
          const isSelected = selectedAyah && selectedAyah.number === ayah.number;
          const isTargetAyah = parseInt(scrollToAyah, 10) === ayah.numberInSurah;
          const isCurrentlyPlaying = isSurahPlaying && currentAyahPlaying === ayah.numberInSurah - 1;
          
          return (
            <View 
              key={ayah.number} 
              style={[
                styles.ayahContainer,
                isTargetAyah && styles.targetAyahContainer
              ]}
              onLayout={(event) => {
                // Store the y-position of this ayah
                measureAyahPosition(ayah.numberInSurah, event.nativeEvent.layout.y);
              }}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handlePress(ayah)}
              >
                <View 
                  style={[
                    styles.ayahItem, 
                    {
                      backgroundColor: theme.SURFACE,
                      borderColor: isCurrentlyPlaying 
                        ? theme.PRIMARY 
                        : isTargetAyah 
                          ? theme.PRIMARY
                          : theme.BORDER,
                      shadowColor: theme.SHADOW,
                      elevation: isSelected || isTargetAyah || isCurrentlyPlaying ? 8 : 2,
                      transform: isSelected || isTargetAyah || isCurrentlyPlaying ? [{ scale: 1.03 }] : [{ scale: 1 }],
                      borderWidth: isCurrentlyPlaying ? 2 : isTargetAyah ? 2 : 1,
                    }
                  ]}
                >
                  <View style={[
                    styles.ayahNumberContainer, 
                    { 
                      backgroundColor: isCurrentlyPlaying 
                        ? theme.PRIMARY 
                        : isTargetAyah 
                          ? theme.PRIMARY_LIGHT
                          : theme.PRIMARY,
                      borderColor: isTargetAyah ? theme.PRIMARY : 'transparent',
                      borderWidth: isTargetAyah ? 2 : 0,
                    }
                  ]}>
                    <Text style={[styles.ayahNumber, { color: theme.WHITE }]}>{ayah.numberInSurah}</Text>
                  </View>
                  <View style={styles.ayahTextContainer}>
                    <Text style={[styles.ayahText, { color: theme.TEXT_PRIMARY }]}>{ayah.text}</Text>
                    {translation && (
                      <Text style={[styles.translationText, { color: theme.TEXT_SECONDARY }]}>
                        {translation.text}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Action Sheet Modal */}
      <Modal
        animationType="none" // We'll handle our own animations
        transparent={true}
        visible={selectedAyah !== null}
        onRequestClose={closeMenu}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: 'rgba(0,0,0,0.4)',
              opacity: modalOpacity,
            }
          ]}
        >
          {/* This TouchableOpacity handles taps outside the modal content */}
          <TouchableOpacity
            style={styles.modalOutsideArea}
            activeOpacity={1}
            onPress={closeMenu}
          >
            <View style={styles.modalContainer}>
              <Animated.View
                style={[
                  styles.actionSheet,
                  {
                    backgroundColor: theme.SURFACE,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
                // Important: prevent clicks inside the modal from triggering the outside TouchableOpacity
                onStartShouldSetResponder={() => true}
                onResponderRelease={(e) => {
                  // Prevent clicks inside from closing
                  e.stopPropagation();
                }}
              >
                {/* Drag handle for visual indicator - only this should respond to pan gesture */}
                <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
                  <View style={[styles.dragHandle, { backgroundColor: theme.BORDER }]} />
                </View>
                
                {selectedAyah && (
                  <View style={styles.actionSheetContent}>
                    <View style={styles.actionSheetHeader}>
                      <Text style={[styles.actionSheetTitle, { color: theme.TEXT_PRIMARY }]}>
                        Ayah {selectedAyah.numberInSurah}
                      </Text>
                    </View>
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleBookmark(selectedAyah)}
                      >
                        <MaterialCommunityIcons name="bookmark-outline" size={28} color={theme.PRIMARY} />
                        <Text style={[styles.actionButtonText, { color: theme.TEXT_PRIMARY }]}>
                          Bookmark
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => isPlaying ? stopAyahAudio() : playAyahAudio(selectedAyah)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color={theme.PRIMARY} />
                        ) : (
                          <MaterialCommunityIcons 
                            name={isPlaying ? "pause-circle" : "play-circle"} 
                            size={28} 
                            color={theme.PRIMARY} 
                          />
                        )}
                        <Text style={[styles.actionButtonText, { color: theme.TEXT_PRIMARY }]}>
                          {isPlaying ? "Stop" : "Play"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Tafseer Section */}
                    <View style={styles.tafseerContainer}>
                      {/* Classical Tafseer Toggle */}
                      <TouchableOpacity
                        style={[
                          styles.tafseerToggle,
                          { borderColor: theme.BORDER }
                        ]}
                        onPress={handleClassicalTafseerToggle}
                        activeOpacity={0.7}
                      >
                        <View style={styles.tafseerToggleHeader}>
                          <MaterialCommunityIcons
                            name="book-open-variant"
                            size={24}
                            color={theme.PRIMARY}
                          />
                          <Text style={[styles.tafseerToggleTitle, { color: theme.TEXT_PRIMARY }]}>
                            View Classical Tafseer
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name={showClassicalTafseer ? "chevron-up" : "chevron-down"}
                          size={24}
                          color={theme.TEXT_SECONDARY}
                        />
                      </TouchableOpacity>
                      
                      {/* Classical Tafseer Content */}
                      {showClassicalTafseer && (
                        <View style={[styles.tafseerContent, { backgroundColor: theme.SURFACE_VARIANT }]}>
                          {isTafseerLoading ? (
                            <View style={styles.tafseerLoading}>
                              <ActivityIndicator size="small" color={theme.PRIMARY} />
                              <Text style={[styles.tafseerLoadingText, { color: theme.TEXT_SECONDARY }]}>
                                Loading tafseer...
                              </Text>
                            </View>
                          ) : (
                            <>
                              <Text 
                                style={[styles.tafseerText, { color: theme.TEXT_PRIMARY }]}
                                numberOfLines={10} // Limit the number of lines
                              >
                                {classicalTafseerContent || "Classical tafseer content is not available for this ayah."}
                              </Text>
                              
                              {classicalTafseerContent && classicalTafseerContent.length > 0 && (
                                <TouchableOpacity
                                  style={[styles.readMoreButton, { backgroundColor: theme.SURFACE, borderColor: theme.PRIMARY }]}
                                  onPress={() => {
                                    // Navigate to full tafseer screen with all necessary data
                                    navigation.navigate('TafseerDetail', {
                                      surahName: surahContent.name,
                                      surahEnglishName: surahContent.englishName,
                                      surahNumber: surahNumber,
                                      ayahNumber: selectedAyah.numberInSurah,
                                      ayahText: selectedAyah.text,
                                      ayahTranslation: translations?.ayahs.find(t => t.numberInSurah === selectedAyah.numberInSurah)?.text,
                                      tafseerContent: classicalTafseerContent
                                    });
                                    // Close the action sheet modal
                                    closeMenu();
                                  }}
                                >
                                  <Text style={[styles.readMoreButtonText, { color: theme.PRIMARY }]}>
                                    Read Full Tafseer
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </>
                          )}
                          
                          {/* Chat with AI Button */}
                          <TouchableOpacity
                            style={[styles.chatWithAiButton, { backgroundColor: theme.PRIMARY, marginTop: 16 }]}
                            onPress={() => handleAiTafseer(selectedAyah)}
                            activeOpacity={0.8}
                          >
                            <MaterialCommunityIcons 
                              name="robot" 
                              size={18} 
                              color={theme.WHITE} 
                            />
                            <Text style={[styles.chatWithAiButtonText, { color: theme.WHITE }]}>
                              Chat with AI about this ayah
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </Animated.View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
    textAlign: 'center',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'IBMPlexSans_700Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'IBMPlexSans_400Regular',
    marginTop: 2,
  },
  scrollView: {
    width: '100%',
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  surahInfo: {
    alignItems: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  surahInfoText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 12,
    width: '100%',
  },
  ayahContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  targetAyahContainer: {
    marginTop: 6,
    marginBottom: 14,
  },
  ayahItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    width: '100%',
    backgroundColor: 'white',
  },
  ayahNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 3,
    flexShrink: 0,
  },
  ayahNumber: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_500Medium',
  },
  ayahTextContainer: {
    flex: 1,
    width: '100%',
  },
  ayahText: {
    fontSize: 20,
    lineHeight: 34,
    textAlign: 'right',
    fontFamily: 'IBMPlexSans_500Medium',
    marginBottom: 10,
    width: '100%',
  },
  translationText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
    fontFamily: 'IBMPlexSans_400Regular',
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOutsideArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheet: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  actionSheetHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginBottom: 10,
  },
  actionSheetDivider: {
    height: 4,
    width: 40,
    borderRadius: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
    gap: 40,
    marginBottom: 10,
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: 'IBMPlexSans_500Medium',
  },
  bismillahContainer: {
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  bismillahText: {
    fontSize: 30,
    lineHeight: 55,
    fontFamily: 'IBMPlexSans_500Medium',
    textAlign: 'center',
    paddingVertical: 5,
  },
  playButton: {
    padding: 8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reciterName: {
    fontSize: 11,
    fontFamily: 'IBMPlexSans_400Regular',
    marginTop: 2,
  },
  tafseerContainer: {
    marginTop: 20,
    width: '100%',
  },
  tafseerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
  },
  tafseerToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tafseerToggleTitle: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_500Medium',
    marginLeft: 10,
  },
  tafseerContent: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  tafseerText: {
    fontSize: 15,
    fontFamily: 'IBMPlexSans_400Regular',
    lineHeight: 22,
  },
  tafseerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  tafseerLoadingText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
  },
  chatWithAiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  chatWithAiButtonText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_500Medium',
    marginLeft: 8,
  },
  readMoreButton: {
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 12,
  },
  readMoreButtonText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_500Medium',
  },
  dragHandleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10, 
    width: '100%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  actionSheetContent: {
    paddingHorizontal: 20,
  },
});

export default SurahDetailScreen; 