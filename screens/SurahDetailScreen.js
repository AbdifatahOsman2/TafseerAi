import React, { useState, useEffect } from 'react';
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

const { width, height } = Dimensions.get('window');

const SurahDetailScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { surahNumber, surah } = route.params;
  const [surahContent, setSurahContent] = useState(null);
  const [translations, setTranslations] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const [selectedAyah, setSelectedAyah] = useState(null);

  // Hide bottom tab bar when screen is focused
  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: 'none' }
      });
    }
    
    return () => {
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            backgroundColor: theme.SURFACE,
            borderTopWidth: 0,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 65,
            paddingBottom: 5,
            paddingTop: 0,
            shadowColor: theme.SHADOW,
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 10,
            borderWidth: 0,
            display: 'flex',
          }
        });
      }
    };
  }, [isFocused, navigation, theme]);

  useEffect(() => {
    fetchSurahContent(surahNumber);
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
        setSurahContent(arabicData.data);
        setTranslations(translationData.data);
      } else {
        console.error('Error fetching surah content:', arabicData, translationData);
      }
    } catch (error) {
      console.error('Error fetching surah content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (ayah) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log("Press detected for ayah:", ayah.numberInSurah);
    setSelectedAyah(ayah);
  };

  const closeMenu = () => {
    setSelectedAyah(null);
  };

  const handleAiTafseer = (ayah) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Add logic to navigate to AI Tafseer screen or show AI Tafseer
    closeMenu();
    // Navigation logic would go here
    console.log("AI Tafseer for ayah:", ayah.numberInSurah);
  };

  const handleBookmark = (ayah) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Add logic to bookmark the ayah
    closeMenu();
    console.log("Bookmarked ayah:", ayah.numberInSurah);
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
        <View style={{ width: 32 }} />
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
        animationType="slide"
        transparent={true}
        visible={selectedAyah !== null}
        onRequestClose={closeMenu}
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
});

export default SurahDetailScreen; 