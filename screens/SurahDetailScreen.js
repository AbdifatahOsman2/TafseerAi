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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

const SurahDetailScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { surahNumber, surah } = route.params;
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
      }
      
      // Unload any existing ayah sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      // Get the audio URL for the ayah
      const responseUrl = `https://api.alquran.cloud/v1/ayah/${ayah.number}/ar.alafasy`;
      const response = await fetch(responseUrl);
      const data = await response.json();
      
      if (data.code === 200 && data.data && data.data.audio) {
        // Get the direct audio URL
        const audioUrl = data.data.audio;
        
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
      }
    } catch (error) {
      console.error('Error playing ayah audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      
      // For Al-Afasy recitation, we can directly use a known URL pattern
      // Format is: https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/{surah_number}.mp3
      const fullSurahUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`;
      
      console.log('Playing surah from URL:', fullSurahUrl);
      
      try {
        // Create a new sound object
        const { sound } = await Audio.Sound.createAsync(
          { uri: fullSurahUrl },
          { shouldPlay: true },
          (status) => {
            if (status.error) {
              console.error('Error loading surah audio:', status.error);
              setIsSurahPlaying(false);
            }
          }
        );
        
        surahSoundRef.current = sound;
        setIsSurahPlaying(true);
        
        // When playback finishes or encounters an error
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish || status.error) {
            setIsSurahPlaying(false);
          }
        });
      } catch (soundError) {
        console.error('Failed to load sound:', soundError);
        setIsSurahPlaying(false);
        
        // Try fallback URL if first attempt fails
        try {
          const fallbackUrl = `https://cdn.alquran.cloud/media/audio/ayah/ar.alafasy/${surahNumber}/1`;
          console.log('Trying fallback URL:', fallbackUrl);
          
          const { sound } = await Audio.Sound.createAsync(
            { uri: fallbackUrl },
            { shouldPlay: true }
          );
          
          surahSoundRef.current = sound;
          setIsSurahPlaying(true);
          
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish || status.error) {
              setIsSurahPlaying(false);
            }
          });
        } catch (fallbackError) {
          console.error('Fallback audio also failed:', fallbackError);
        }
      }
    } catch (error) {
      console.error('Error playing surah audio:', error);
      setIsSurahPlaying(false);
    } finally {
      setIsSurahLoading(false);
    }
  };

  // Function to stop surah audio
  const stopSurahAudio = async () => {
    if (surahSoundRef.current) {
      await surahSoundRef.current.stopAsync();
      setIsSurahPlaying(false);
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
    setSelectedAyah(null);
  };

  const handleAiTafseer = (ayah) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Add logic to navigate to AI Tafseer screen or show AI Tafseer
    closeMenu();
    // Navigation logic would go here
  };

  const handleBookmark = (ayah) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Add logic to bookmark the ayah
    closeMenu();
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
                      onPress={() => handleAiTafseer(selectedAyah)}
                    >
                      <MaterialCommunityIcons name="brain" size={28} color={theme.PRIMARY} />
                      <Text style={[styles.actionButtonText, { color: theme.TEXT_PRIMARY }]}>
                        AI Tafseer
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
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleBookmark(selectedAyah)}
                    >
                      <MaterialCommunityIcons name="bookmark-outline" size={28} color={theme.PRIMARY} />
                      <Text style={[styles.actionButtonText, { color: theme.TEXT_PRIMARY }]}>
                        Bookmark
                      </Text>
                    </TouchableOpacity>
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
    justifyContent: 'space-around',
    width: '100%',
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
});

export default SurahDetailScreen; 