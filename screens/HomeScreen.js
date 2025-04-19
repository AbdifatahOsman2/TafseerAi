import React from 'react';
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

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();

  const navigateToBookmarks = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Bookmarks');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND }]}>
      <StatusBar barStyle={theme.DARK ? "light-content" : "dark-content"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text style={[styles.screenTitle, { color: theme.TEXT_PRIMARY }]}>TafseerAI</Text>
        
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
            <Image 
              source={require('../assets/quran-image.png')} 
              style={styles.quranImage}
              resizeMode="contain"
            />
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
          
          {/* Additional content can be added here */}
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
  screenTitle: {
    fontSize: 28,
    fontFamily: 'IBMPlexSans_700Bold',
    marginTop: StatusBar.currentHeight || 40,
    marginHorizontal: 20,
    marginBottom: 20,
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
  quranImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  bookmarksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    borderWidth: 2,
    marginTop: 10,
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
  }
});

export default HomeScreen; 