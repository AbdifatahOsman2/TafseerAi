import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  StatusBar, 
  ScrollView, 
  TouchableOpacity,
  Image
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useUser } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as bookmarkService from '../services/bookmarkService';
import * as userActivityService from '../services/userActivityService';
import verseService from '../services/verseService';

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, isGuest } = useUser();
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [daysActive, setDaysActive] = useState(0);
  const [lastVisit, setLastVisit] = useState(null);
  const [userStats, setUserStats] = useState({
    totalSurahsVisited: 0,
    totalTime: 0
  });
  const [dailyVerse, setDailyVerse] = useState({
    arabic: "",
    translation: "Loading...",
    surah: "",
    ayahNumber: 0,
    surahNumber: 0
  });

  // Format time to display in a friendly way
  const formatTotalTime = (minutes) => {
    if (!minutes) return '0 min';
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) { // less than a day
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${hours > 0 ? `${hours}h` : ''}`;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  useEffect(() => {
    // Load user stats and track activity
    loadUserStats();
    loadDailyVerse();
  }, [user, isGuest]); // Re-run when user or guest status changes

  // Load user stats from appropriate storage
  const loadUserStats = async () => {
    try {
      // Track daily activity and get updated stats
      const activityData = await userActivityService.trackDailyActivity(user, isGuest);
      setDaysActive(activityData.daysActive);
      
      if (activityData.lastVisit) {
        setLastVisit(new Date(activityData.lastVisit));
      }
      
      // Load bookmark count
      await loadBookmarkCount();

      // Load user stats
      const stats = await userActivityService.getUserActivityStats(user, isGuest);
      setUserStats(stats);
    } catch (error) {
      // Error handling without console.error
    }
  };

  const loadBookmarkCount = async () => {
    try {
      const loadedBookmarks = await bookmarkService.loadBookmarks(user, isGuest);
      setBookmarksCount(loadedBookmarks.length);
    } catch (error) {
      // Error handling without console.error
    }
  };

  // Load daily verse from the service
  const loadDailyVerse = async () => {
    try {
      const verse = await verseService.getDailyVerse();
      setDailyVerse(verse);
    } catch (error) {
      // Error handling
    }
  };

  const navigateToBookmarks = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Bookmarks');
  };

  const navigateToSurah = (surahNumber, ayahNumber) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('SurahDetail', { 
      surahNumber,
      scrollToAyah: ayahNumber 
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND }]}>
      <StatusBar barStyle={theme.DARK ? "light-content" : "dark-content"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.headerContainer}>
          <Text style={[styles.screenTitle, { color: theme.TEXT_PRIMARY }]}>TafseerAI</Text>
          <Image 
            source={require('../assets/quran-image.png')} 
            style={styles.headerQuranImage}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.content}>
          <View style={[styles.welcomeCard, { 
            backgroundColor: theme.SURFACE, 
            borderColor: theme.BORDER,
            shadowColor: theme.SHADOW
          }]}>
            <View style={styles.welcomeContent}>
              <Text style={[styles.title, { color: theme.TEXT_PRIMARY }]}>Welcome</Text>
              <Text style={[styles.subtitle, { color: theme.TEXT_SECONDARY }]}>
                Explore the Quran with AI-powered tafseer and bookmark your favorite ayahs for easy reference.
              </Text>
            </View>
          </View>
          
          {/* Daily Verse Card */}
          <View style={[styles.dailyVerseCard, { 
            backgroundColor: theme.SURFACE, 
            borderColor: theme.BORDER,
            shadowColor: theme.SHADOW
          }]}>
            <View style={styles.dailyVerseHeader}>
              <MaterialCommunityIcons 
                name="star-four-points" 
                size={20} 
                color={theme.PRIMARY} 
              />
              <Text style={[styles.dailyVerseTitle, { color: theme.TEXT_PRIMARY }]}>
                Daily Verse
              </Text>
            </View>
            
            <Text style={[styles.arabicText, { color: theme.TEXT_PRIMARY }]}>
              {dailyVerse.arabic}
            </Text>
            
            <Text style={[styles.translationText, { color: theme.TEXT_SECONDARY }]}>
              "{dailyVerse.translation}"
            </Text>
            
            <View style={styles.verseReference}>
              <Text style={[styles.referenceText, { color: theme.TEXT_TERTIARY }]}>
                {dailyVerse.surah} ({dailyVerse.surahNumber}:{dailyVerse.ayahNumber})
              </Text>
              
              <TouchableOpacity
                style={[styles.readMoreButton, { backgroundColor: theme.PRIMARY_LIGHT }]}
                onPress={() => navigateToSurah(dailyVerse.surahNumber, dailyVerse.ayahNumber)}
              >
                <Text style={[styles.readMoreText, { color: theme.PRIMARY }]}>
                  Read More
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Bookmarks Button */}
          <TouchableOpacity
            style={[styles.bookmarksButton, { 
              backgroundColor: theme.PRIMARY_LIGHT,
              borderColor: theme.PRIMARY
            }]}
            onPress={navigateToBookmarks}
            activeOpacity={0.8}
          >
            <View style={styles.bookmarkIconContainer}>
              <MaterialCommunityIcons 
                name="bookmark-multiple" 
                size={36} 
                color={theme.PRIMARY} 
              />
            </View>
            <View style={styles.bookmarkTextContainer}>
              <Text style={[styles.bookmarkTitle, { color: theme.PRIMARY }]}>
                Bookmarks
              </Text>
              <Text style={[styles.bookmarkSubtitle, { color: theme.TEXT_SECONDARY }]}>
                View your saved ayahs
              </Text>
            </View>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={24} 
              color={theme.PRIMARY} 
            />
          </TouchableOpacity>
          
          {/* User Stats Summary - at the bottom */}
          <View style={[styles.statsCard, { 
            backgroundColor: theme.SURFACE, 
            borderColor: theme.BORDER,
            shadowColor: theme.SHADOW,
            marginTop: 'auto'
          }]}>
            <Text style={[styles.statsTitle, { color: theme.TEXT_PRIMARY }]}>
              Your Journey
            </Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons 
                  name="bookmark" 
                  size={24} 
                  color={theme.PRIMARY} 
                />
                <Text style={[styles.statValue, { color: theme.TEXT_PRIMARY }]}>
                  {bookmarksCount}
                </Text>
                <Text style={[styles.statLabel, { color: theme.TEXT_SECONDARY }]}>
                  Bookmarks
                </Text>
              </View>
              
              <View style={[styles.divider, { backgroundColor: theme.BORDER }]} />
              
              <View style={styles.statItem}>
                <MaterialCommunityIcons 
                  name="calendar-check" 
                  size={24} 
                  color={theme.PRIMARY} 
                />
                <Text style={[styles.statValue, { color: theme.TEXT_PRIMARY }]}>
                  {daysActive}
                </Text>
                <Text style={[styles.statLabel, { color: theme.TEXT_SECONDARY }]}>
                  Days Active
                </Text>
              </View>
              
              <View style={[styles.divider, { backgroundColor: theme.BORDER }]} />
              
              {!isGuest && userStats?.loginCount ? (
                <View style={styles.statItem}>
                  <MaterialCommunityIcons 
                    name="login" 
                    size={24} 
                    color={theme.PRIMARY} 
                  />
                  <Text style={[styles.statValue, { color: theme.TEXT_PRIMARY }]}>
                    {userStats.loginCount || 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.TEXT_SECONDARY }]}>
                    Logins
                  </Text>
                </View>
              ) : (
                <View style={styles.statItem}>
                  <MaterialCommunityIcons 
                    name="account" 
                    size={24} 
                    color={theme.PRIMARY} 
                  />
                  <Text style={[styles.statValue, { color: theme.TEXT_PRIMARY }]}>
                    {isGuest ? 'Guest' : 'Member'}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.TEXT_SECONDARY }]}>
                    Status
                  </Text>
                </View>
              )}
            </View>
            
            {/* Additional stats for logged-in users */}
            {!isGuest && userStats?.totalUsageMinutes && (
              <View style={styles.additionalStatsContainer}>
                <View style={styles.additionalStat}>
                  <MaterialCommunityIcons 
                    name="clock-outline" 
                    size={20} 
                    color={theme.PRIMARY} 
                    style={styles.additionalStatIcon}
                  />
                  <View style={styles.additionalStatTextContainer}>
                    <Text style={[styles.additionalStatLabel, { color: theme.TEXT_SECONDARY }]}>
                      Total App Usage
                    </Text>
                    <Text style={[styles.additionalStatValue, { color: theme.TEXT_PRIMARY }]}>
                      {formatTotalTime(userStats.totalUsageMinutes)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.additionalStat}>
                  <MaterialCommunityIcons 
                    name="calendar" 
                    size={20} 
                    color={theme.PRIMARY} 
                    style={styles.additionalStatIcon}
                  />
                  <View style={styles.additionalStatTextContainer}>
                    <Text style={[styles.additionalStatLabel, { color: theme.TEXT_SECONDARY }]}>
                      First Joined
                    </Text>
                    <Text style={[styles.additionalStatValue, { color: theme.TEXT_PRIMARY }]}>
                      {formatDate(userStats.firstLogin || userStats.firstVisit)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: StatusBar.currentHeight || 40,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontFamily: 'IBMPlexSans_700Bold',
  },
  headerQuranImage: {
    width: 32,
    height: 32,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 25,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  welcomeContent: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
    lineHeight: 22,
  },
  dailyVerseCard: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
  },
  dailyVerseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dailyVerseTitle: {
    fontSize: 18,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginLeft: 8,
  },
  arabicText: {
    fontSize: 22,
    fontFamily: 'IBMPlexSans_500Medium',
    textAlign: 'right',
    lineHeight: 38,
    marginBottom: 16,
  },
  translationText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
    lineHeight: 24,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  verseReference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referenceText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_500Medium',
  },
  readMoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  readMoreText: {
    fontSize: 12,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  bookmarksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    borderWidth: 2,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 6,
  },
  bookmarkIconContainer: {
    marginRight: 16,
  },
  bookmarkTextContainer: {
    flex: 1,
  },
  bookmarkTitle: {
    fontSize: 20,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginBottom: 4,
  },
  bookmarkSubtitle: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    marginTop: 10,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'IBMPlexSans_700Bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'IBMPlexSans_400Regular',
  },
  divider: {
    width: 1,
    height: 50,
    marginHorizontal: 10,
  },
  additionalStatsContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 15,
    flexDirection: 'column',
    gap: 12,
  },
  additionalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  additionalStatIcon: {
    marginRight: 12,
    width: 22,
    alignItems: 'center',
  },
  additionalStatTextContainer: {
    flexDirection: 'column',
  },
  additionalStatLabel: {
    fontSize: 12,
    fontFamily: 'IBMPlexSans_400Regular',
    marginBottom: 2,
  },
  additionalStatValue: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
});

export default HomeScreen; 