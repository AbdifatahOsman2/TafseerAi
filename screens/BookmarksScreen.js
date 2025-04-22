import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  StatusBar,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import * as Haptics from 'expo-haptics';
import * as bookmarkService from '../services/bookmarkService';

const BookmarksScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, isGuest } = useUser();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load bookmarks when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadBookmarks();
    });

    return unsubscribe;
  }, [navigation, user, isGuest]);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const loadedBookmarks = await bookmarkService.loadBookmarks(user, isGuest);
      // Sort bookmarks by timestamp, newest first
      const sortedBookmarks = loadedBookmarks.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      setBookmarks(sortedBookmarks);
    } catch (error) {
      // Error handling without console.error
      Alert.alert('Error', 'Failed to load bookmarks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (bookmarkToRemove) => {
    try {
      const success = await bookmarkService.removeBookmark(bookmarkToRemove, user, isGuest);
      
      if (success) {
        const updatedBookmarks = bookmarks.filter(
          bookmark => bookmark.id !== bookmarkToRemove.id && 
                     bookmark.ayah.number !== bookmarkToRemove.ayah.number
        );
        
        setBookmarks(updatedBookmarks);
        
        // Show success message
        Alert.alert('Bookmark Removed', 'The bookmark has been successfully removed.');
      } else {
        throw new Error('Failed to remove bookmark');
      }
    } catch (error) {
      // Error handling without console.error
      Alert.alert('Error', 'Failed to remove bookmark. Please try again.');
    }
  };

  const navigateToSurah = (surahNumber, ayahNumber) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('SurahDetail', { 
      surahNumber: surahNumber,
      scrollToAyah: ayahNumber
    });
  };

  const renderBookmarkItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[styles.bookmarkCard, { 
          backgroundColor: theme.SURFACE,
          borderColor: theme.BORDER
        }]}
        onPress={() => navigateToSurah(item.surah.number, item.ayah.numberInSurah)}
        activeOpacity={0.7}
      >
        <View style={styles.bookmarkHeader}>
          <View style={styles.surahInfo}>
            <Text style={[styles.surahName, { color: theme.TEXT_PRIMARY }]}>
              {item.surah.name} ({item.surah.englishName})
            </Text>
            <Text style={[styles.ayahNumber, { color: theme.TEXT_SECONDARY }]}>
              Ayah {item.ayah.numberInSurah}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeBookmark(item)}
          >
            <MaterialCommunityIcons 
              name="bookmark-remove" 
              size={24} 
              color={theme.DANGER} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.ayahContainer}>
          <Text style={[styles.arabicText, { color: theme.TEXT_PRIMARY }]}>
            {item.ayah.text}
          </Text>
          {item.ayah.translation && (
            <Text style={[styles.translationText, { color: theme.TEXT_SECONDARY }]}>
              {item.ayah.translation}
            </Text>
          )}
        </View>

        {item.tafseerText && (
          <View style={[styles.tafseerContainer, { backgroundColor: theme.PRIMARY_LIGHT }]}>
            <Text style={[styles.tafseerLabel, { color: theme.PRIMARY }]}>
              Classical Tafseer:
            </Text>
            <Text style={[styles.tafseerText, { color: theme.TEXT_PRIMARY }]}>
              {item.tafseerText}
            </Text>
          </View>
        )}

        <Text style={[styles.dateText, { color: theme.TEXT_TERTIARY }]}>
          Bookmarked: {new Date(item.timestamp).toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name="bookmark-outline" 
          size={80} 
          color={theme.TEXT_TERTIARY} 
        />
        <Text style={[styles.emptyTitle, { color: theme.TEXT_PRIMARY }]}>
          No Bookmarks Yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.TEXT_SECONDARY }]}>
          Bookmark your favorite ayahs to see them here
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND }]}>
      <StatusBar barStyle={theme.DARK ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
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
        <Text style={[styles.headerTitle, { color: theme.TEXT_PRIMARY }]}>
          Bookmarks
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.PRIMARY} />
          <Text style={[styles.loadingText, { color: theme.TEXT_SECONDARY }]}>
            Loading bookmarks...
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          renderItem={renderBookmarkItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'IBMPlexSans_600SemiBold',
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  bookmarkCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: 18,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginBottom: 4,
  },
  ayahNumber: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
  },
  removeButton: {
    padding: 4,
  },
  ayahContainer: {
    marginBottom: 12,
  },
  arabicText: {
    fontSize: 20,
    fontFamily: 'IBMPlexSans_500Medium',
    textAlign: 'right',
    lineHeight: 32,
    marginBottom: 8,
  },
  translationText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
    lineHeight: 24,
  },
  tafseerContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tafseerLabel: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginBottom: 4,
  },
  tafseerText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
    lineHeight: 20,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'IBMPlexSans_400Regular',
    textAlign: 'right',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default BookmarksScreen; 