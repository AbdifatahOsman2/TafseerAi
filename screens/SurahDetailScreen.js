import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useReciter } from '../context/ReciterContext';
import { fetchClassicalTafseer } from '../services/tafseerService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SurahDetailScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { surahNumber, surah } = route.params;
  const { selectedReciter } = useReciter();
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
  const [showClassicalTafseer, setShowClassicalTafseer] = useState(false);
  const [showAITafseer, setShowAITafseer] = useState(false);
  const [classicalTafseerContent, setClassicalTafseerContent] = useState('');
  const [aiTafseerContent, setAiTafseerContent] = useState('');
  const [isTafseerLoading, setIsTafseerLoading] = useState(false);
  const [currentAyahPlaying, setCurrentAyahPlaying] = useState(0);
  const [ayahsToPlay, setAyahsToPlay] = useState([]);

  // Define Bismillah text for display purposes
  const BISMILLAH = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ";

  useEffect(() => {
    fetchSurahContent(surahNumber);
    
    // Initialize audio
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    
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
        
        // Don't modify Al-Fatiha or At-Tawbah
        if (number !== 1 && number !== 9 && processedArabicData.ayahs && processedArabicData.ayahs.length > 0) {
          console.log("====== Processing Surah", number, "======");
          
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
      } else {
        console.error('Error fetching surah content:', arabicData, translationData);
      }
    } catch (error) {
      console.error('Error fetching surah content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to play ayah audio
  const playAyahAudio = async (ayah) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsLoading(true);
      
      // Stop surah audio if playing
      if (surahSoundRef.current) {
        await surahSoundRef.current.unloadAsync();
        setIsSurahPlaying(false);
        setCurrentAyahPlaying(0);
        setAyahsToPlay([]);
      }
      
      // Unload any existing ayah sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      // Get the audio URL for the ayah directly from the API
      const responseUrl = `https://api.alquran.cloud/v1/ayah/${ayah.number}/${selectedReciter.id}`;
      console.log(`Fetching ayah audio from API: ${responseUrl}`);
      
      const response = await fetch(responseUrl);
      const data = await response.json();
      
      if (data.code === 200 && data.data && data.data.audio) {
        // Get the direct audio URL
        const audioUrl = data.data.audio;
        console.log(`Playing ayah from URL: ${audioUrl}`);
        
        // Create a new sound object
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        );
        
        soundRef.current = sound;
        setIsPlaying(true);
        
        // When playback finishes
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } else {
        throw new Error("Failed to get audio URL from API");
      }
    } catch (error) {
      console.error('Error playing ayah audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to play the next ayah in the queue
  const playNextAyah = async () => {
    if (ayahsToPlay.length === 0 || currentAyahPlaying >= ayahsToPlay.length) {
      // We've finished playing all ayahs
      setIsSurahPlaying(false);
      setCurrentAyahPlaying(0);
      setAyahsToPlay([]);
      return;
    }
    
    try {
      // Unload any existing sound
      if (surahSoundRef.current) {
        await surahSoundRef.current.unloadAsync();
      }
      
      const currentAyahIndex = currentAyahPlaying;
      const ayahToPlay = ayahsToPlay[currentAyahIndex];
      
      console.log(`Playing ayah ${currentAyahIndex + 1}/${ayahsToPlay.length} - global number: ${ayahToPlay}`);
      
      // Use the CDN URL format
      const bitrate = '128';
      const reciterId = selectedReciter.id;
      const url = `https://cdn.islamic.network/quran/audio/${bitrate}/${reciterId}/${ayahToPlay}.mp3`;
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      
      surahSoundRef.current = sound;
      
      // When playback finishes or encounters an error
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          // Move to the next ayah
          setCurrentAyahPlaying(current => current + 1);
        } else if (status.error) {
          console.error(`Error playing ayah ${ayahToPlay}:`, status.error);
          // Skip to next ayah on error
          setCurrentAyahPlaying(current => current + 1);
        }
      });
    } catch (error) {
      console.error('Error in playNextAyah:', error);
      // Skip to next ayah on error
      setCurrentAyahPlaying(current => current + 1);
    }
  };
  
  // Watch for changes to currentAyahPlaying to play the next ayah
  useEffect(() => {
    if (isSurahPlaying && ayahsToPlay.length > 0) {
      playNextAyah();
    }
  }, [currentAyahPlaying, isSurahPlaying]);

  // Function to stop playing
  const stopAyahAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      setIsPlaying(false);
    }
  };

  // Function to play entire surah audio
  const playSurahAudio = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsSurahLoading(true);
      
      // Stop ayah audio if playing
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        setIsPlaying(false);
      }
      
      // Unload any existing surah sound
      if (surahSoundRef.current) {
        await surahSoundRef.current.unloadAsync();
      }
      
      // Fall back to CDN approach for more reliable playback
      // We'll use a pre-calculated list of global ayah numbers for all 114 surahs
      const surahStartingPositions = [
        1, 8, 294, 494, 670, 790, 955, 1161, 1236, 1365, 1474, 1597, 1708, 1751, 1803, 1902, 2030, 2141, 
        2251, 2349, 2484, 2596, 2674, 2792, 2856, 2933, 3160, 3253, 3341, 3410, 3470, 3504, 3534, 3607, 
        3661, 3706, 3789, 3971, 4059, 4134, 4219, 4273, 4326, 4415, 4474, 4511, 4546, 4584, 4613, 4631, 
        4676, 4736, 4785, 4835, 4876, 4930, 4981, 5030, 5062, 5105, 5142, 5172, 5220, 5242, 5272, 5324, 
        5376, 5420, 5448, 5476, 5496, 5552, 5592, 5623, 5673, 5713, 5759, 5801, 5830, 5849, 5885, 5910, 
        5932, 5949, 5968, 5994, 6024, 6044, 6059, 6080, 6091, 6099, 6107, 6126, 6131, 6139, 6147, 6158, 
        6169, 6177, 6180, 6189, 6194, 6198, 6205, 6208, 6214, 6217, 6222, 6226, 6231, 6234
      ];
      
      // Generate the list of all global ayah numbers for this surah
      const startingIndex = surahStartingPositions[surahNumber - 1] || 1;
      const numberOfAyahs = surahContent.numberOfAyahs || 1;
      
      // Calculate the ending index (exclusive)
      let endingIndex;
      if (surahNumber < 114) {
        endingIndex = surahStartingPositions[surahNumber]; // Next surah's starting index
      } else {
        endingIndex = 6237; // After the last ayah of the Quran
      }
      
      // Create array of all ayah numbers to play
      const ayahNumbers = [];
      for (let i = startingIndex; i < endingIndex; i++) {
        ayahNumbers.push(i);
      }
      
      setAyahsToPlay(ayahNumbers);
      setCurrentAyahPlaying(0);
      setIsSurahPlaying(true);
      
    } catch (error) {
      console.error('Error setting up surah audio:', error);
      setIsSurahPlaying(false);
      
      // Show error message to user
      Alert.alert(
        "Playback Error",
        "There was an error playing the surah audio. Please try again or select a different reciter.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSurahLoading(false);
    }
  };

  // Function to stop surah audio
  const stopSurahAudio = async () => {
    if (surahSoundRef.current) {
      await surahSoundRef.current.stopAsync();
      setIsSurahPlaying(false);
      setCurrentAyahPlaying(0);
      setAyahsToPlay([]);
    }
  };

  const handlePress = (ayah) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedAyah(ayah);
  };

  const closeMenu = () => {
    // Stop any playing audio when closing the menu
    if (soundRef.current) {
      stopAyahAudio();
    }
    
    // Reset tafseer states
    setShowClassicalTafseer(false);
    setShowAITafseer(false);
    setClassicalTafseerContent('');
    setAiTafseerContent('');
    
    // Close the modal
    setSelectedAyah(null);
  };

  const handleAiTafseer = (ayah) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to TafseerScreen with the selected ayah context
    closeMenu();
    
    // Create a complete surah object with all necessary properties
    const fullSurahObject = {
      number: surahNumber,
      name: surahContent.name,
      englishName: surahContent.englishName,
      numberOfAyahs: surahContent.numberOfAyahs,
      revelationType: surahContent.revelationType,
      englishNameTranslation: surahContent.englishNameTranslation
    };
    
    // Navigate to the TafseerScreen with surah and ayah information
    navigation.navigate('Tafseer', {
      surah: fullSurahObject,
      ayah: {
        number: ayah.number,
        numberInSurah: ayah.numberInSurah,
        text: ayah.text,
        translation: translations?.ayahs.find(t => t.numberInSurah === ayah.numberInSurah)?.text || ''
      },
      mode: 'ai', // Default to AI mode
      initialQuestion: `Could you explain the meaning of Surah ${surahNumber}, Ayah ${ayah.numberInSurah}?` // Prefill a question
    });
  };

  const handleBookmark = async (ayah) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // First get the translation for this ayah
      const translation = translations?.ayahs.find(t => t.numberInSurah === ayah.numberInSurah)?.text || '';
      
      // If we've loaded the classical tafseer for this ayah, include it in the bookmark
      let tafseerText = null;
      if (selectedAyah && selectedAyah.numberInSurah === ayah.numberInSurah && classicalTafseerContent) {
        // We have the tafseer loaded, so include it in the bookmark
        tafseerText = classicalTafseerContent;
      }
      
      // Create bookmark object
      const bookmarkData = {
        id: `${surahNumber}-${ayah.numberInSurah}`,
        surahNumber: surahNumber,
        surahName: surahContent.name,
        surahEnglishName: surahContent.englishName,
        numberInSurah: ayah.numberInSurah,
        arabicText: ayah.text,
        translationText: translation,
        tafseerText: tafseerText,
        timestamp: Date.now()
      };
      
      // Get existing bookmarks or initialize empty array
      const existingBookmarksJSON = await AsyncStorage.getItem('bookmarkedAyahs');
      let bookmarks = [];
      
      if (existingBookmarksJSON) {
        bookmarks = JSON.parse(existingBookmarksJSON);
        
        // Check if this ayah is already bookmarked
        const isAlreadyBookmarked = bookmarks.some(bookmark => bookmark.id === bookmarkData.id);
        
        if (isAlreadyBookmarked) {
          // Show message that it's already bookmarked
          Alert.alert(
            'Already Bookmarked',
            'This ayah is already in your bookmarks.',
            [{ text: 'OK' }]
          );
          closeMenu();
          return;
        }
      }
      
      // Add new bookmark to the array
      bookmarks.push(bookmarkData);
      
      // Save updated bookmarks
      await AsyncStorage.setItem('bookmarkedAyahs', JSON.stringify(bookmarks));
      
      // Provide feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Bookmark Added',
        'Ayah has been added to your bookmarks.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error bookmarking ayah:', error);
      Alert.alert(
        'Error',
        'Could not bookmark this ayah. Please try again.',
        [{ text: 'OK' }]
      );
    }
    
    closeMenu();
  };

  const handleClassicalTafseerToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Toggle the visibility
    setShowClassicalTafseer(!showClassicalTafseer);
    
    // Fetch tafseer content if it hasn't been loaded and we're opening the section
    if (!classicalTafseerContent && !showClassicalTafseer && selectedAyah) {
      setIsTafseerLoading(true);
      try {
        // Use our service directly since HTML parsing in React Native requires additional libraries
        const tafseer = await fetchClassicalTafseer(surahNumber, selectedAyah.numberInSurah);
        setClassicalTafseerContent(tafseer.text);
        
        // Pre-fetch AI interpretation so it's ready when needed
        setTimeout(() => {
          generateAITafseer(tafseer.text);
        }, 1000);
      } catch (error) {
        console.error('Error fetching classical tafseer:', error);
        setClassicalTafseerContent('Unable to load classical tafseer at this time. Please try again later.');
      } finally {
        setIsTafseerLoading(false);
      }
    }
  };

  const generateAITafseer = async (classicalText) => {
    if (!aiTafseerContent && classicalText) {
      try {
        // For demonstration, we'll generate a fixed response based on the surah number
        // In a real app, this would call an AI service API
        
        // Example responses for different surah groups:
        const aiResponses = {
          // First 10 surahs
          1: "This opening chapter establishes our relationship with Allah as one of worship and seeking guidance. It reminds us that in our daily challenges, we should ask for direction from the One who created us. This prayer remains essential for modern Muslims navigating complex moral decisions.",
          2: "This verse emphasizes the importance of maintaining faith despite life's uncertainties. It teaches us that true conviction means trusting Allah's wisdom even when we don't understand His plan. In today's skeptical world, this reminds us that some truths require belief beyond empirical evidence.",
          3: "Family relationships are highlighted here as a foundation for societal strength. The verse reminds us that respecting family bonds teaches us patience, cooperation, and selflessness. In an era of increasing isolation, these connections provide essential support and grounding.",
          // Default for other surahs
          default: "This verse reminds us of our responsibility to be mindful of our actions in everyday life. It emphasizes the importance of integrity and compassion, even in small matters that others might not notice. In today's fast-paced world, this teaching encourages us to pause and reflect on how our choices impact both ourselves and those around us."
        };
        
        // Select response based on surah number or use default
        let aiResponse = aiResponses[surahNumber] || aiResponses.default;
        
        // Set the AI tafseer content
        setAiTafseerContent(aiResponse);
      } catch (error) {
        console.error('Error generating AI tafseer:', error);
      }
    }
  };

  const handleAITafseerToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Toggle the visibility
    setShowAITafseer(!showAITafseer);
    
    // If AI tafseer content isn't loaded yet, show loading state
    if (!aiTafseerContent && !showAITafseer && classicalTafseerContent) {
      setIsTafseerLoading(true);
      try {
        await generateAITafseer(classicalTafseerContent);
      } catch (error) {
        console.error('Error in AI tafseer toggle:', error);
        setAiTafseerContent('Unable to generate AI interpretation at this time. Please try again later.');
      } finally {
        setIsTafseerLoading(false);
      }
    }
  };

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
            Reciter: {selectedReciter.name.split(' ')[0]}
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
          
          return (
            <View key={ayah.number} style={styles.ayahContainer}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handlePress(ayah)}
              >
                <View 
                  style={[
                    styles.ayahItem, 
                    {
                      backgroundColor: theme.SURFACE,
                      borderColor: theme.BORDER,
                      shadowColor: theme.SHADOW,
                      elevation: isSelected ? 8 : 2,
                      transform: isSelected ? [{ scale: 1.03 }] : [{ scale: 1 }],
                    }
                  ]}
                >
                  <View style={[styles.ayahNumberContainer, { backgroundColor: theme.PRIMARY }]}>
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
        animationType="fade"
        transparent={true}
        visible={selectedAyah !== null}
        onRequestClose={closeMenu}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.actionSheet, { backgroundColor: theme.SURFACE }]}>
              {selectedAyah && (
                <>
                  <View style={styles.actionSheetHeader}>
                    <Text style={[styles.actionSheetTitle, { color: theme.TEXT_PRIMARY }]}>
                      Ayah {selectedAyah.numberInSurah}
                    </Text>
                    <View style={[styles.actionSheetDivider, { backgroundColor: theme.BORDER }]} />
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
                          <Text style={[styles.tafseerText, { color: theme.TEXT_PRIMARY }]}>
                            {classicalTafseerContent || "Classical tafseer content is not available for this ayah."}
                          </Text>
                        )}
                        
                        {/* AI Tafseer Toggle (only shown when classical is expanded) */}
                        <TouchableOpacity
                          style={[
                            styles.tafseerToggle,
                            styles.aiTafseerToggle,
                            { borderColor: theme.BORDER, marginTop: 16 }
                          ]}
                          onPress={handleAITafseerToggle}
                          activeOpacity={0.7}
                        >
                          <View style={styles.tafseerToggleHeader}>
                            <MaterialCommunityIcons
                              name="robot"
                              size={24}
                              color={theme.PRIMARY}
                            />
                            <Text style={[styles.tafseerToggleTitle, { color: theme.TEXT_PRIMARY }]}>
                              View AI Tafseer
                            </Text>
                          </View>
                          <MaterialCommunityIcons
                            name={showAITafseer ? "chevron-up" : "chevron-down"}
                            size={24}
                            color={theme.TEXT_SECONDARY}
                          />
                        </TouchableOpacity>
                        
                        {/* AI Tafseer Content */}
                        {showAITafseer && (
                          <View style={[styles.tafseerContent, styles.aiTafseerContent, { backgroundColor: theme.SURFACE_VARIANT }]}>
                            {isTafseerLoading ? (
                              <View style={styles.tafseerLoading}>
                                <ActivityIndicator size="small" color={theme.PRIMARY} />
                                <Text style={[styles.tafseerLoadingText, { color: theme.TEXT_SECONDARY }]}>
                                  Generating modern interpretation...
                                </Text>
                              </View>
                            ) : (
                              <>
                                <Text style={[styles.tafseerText, { color: theme.TEXT_PRIMARY }]}>
                                  {aiTafseerContent || "AI interpretation is not available for this ayah."}
                                </Text>
                                
                                <TouchableOpacity
                                  style={[styles.chatWithAiButton, { backgroundColor: theme.PRIMARY }]}
                                  onPress={() => handleAiTafseer(selectedAyah)}
                                  activeOpacity={0.8}
                                >
                                  <MaterialCommunityIcons 
                                    name="message-text" 
                                    size={18} 
                                    color={theme.WHITE} 
                                  />
                                  <Text style={[styles.chatWithAiButtonText, { color: theme.WHITE }]}>
                                    Chat with AI
                                  </Text>
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    transform: [{ translateY: 0 }],
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
    borderRadius: 10,
    marginBottom: 12,
  },
  aiTafseerToggle: {
    marginTop: 8,
  },
  aiTafseerContent: {
    marginTop: 8,
  },
  tafseerText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
    lineHeight: 20,
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
});

export default SurahDetailScreen; 