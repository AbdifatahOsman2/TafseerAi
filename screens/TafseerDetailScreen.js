import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  StatusBar,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const TafseerDetailScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { 
    surahName, 
    surahEnglishName, 
    surahNumber,
    ayahNumber,
    ayahText,
    ayahTranslation,
    tafseerContent
  } = route.params;

  // Function to handle the "Chat with AI" button
  const handleAiTafseer = () => {
    try {
      // Get the surah info for navigation
      const surahInfo = {
        name: surahName,
        englishName: surahEnglishName,
        number: surahNumber,
        ayah: {
          number: ayahNumber,
          numberInSurah: ayahNumber,
          text: ayahText,
          translation: ayahTranslation
        }
      };
      
      // Prepare the initial question about this surah and ayah
      const initialQuestion = `Tell me more about Surah ${surahNumber} and Ayah ${ayahNumber}.`;
      
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND }]}>
      <StatusBar barStyle={theme.DARK ? "light-content" : "dark-content"} />
      
      {/* Header */}
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
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: theme.TEXT_PRIMARY }]}>
            Classical Tafseer
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.TEXT_SECONDARY }]}>
            {surahEnglishName} ({surahName}) • Ayah {ayahNumber}
          </Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ayah Section */}
        <View style={[styles.ayahContainer, { backgroundColor: theme.SURFACE, borderColor: theme.BORDER }]}>
          <View style={[styles.ayahNumberContainer, { backgroundColor: theme.PRIMARY }]}>
            <Text style={[styles.ayahNumber, { color: theme.WHITE }]}>{ayahNumber}</Text>
          </View>
          
          <View style={styles.ayahTextContainer}>
            <Text style={[styles.ayahText, { color: theme.TEXT_PRIMARY }]}>
              {ayahText}
            </Text>
            
            {ayahTranslation && (
              <Text style={[styles.translationText, { color: theme.TEXT_SECONDARY }]}>
                {ayahTranslation}
              </Text>
            )}
          </View>
        </View>
        
        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.BORDER }]} />
        
        {/* Tafseer Section */}
        <View style={styles.tafseerContainer}>
          <Text style={[styles.tafseerLabel, { color: theme.TEXT_SECONDARY }]}>
            Classical Tafseer
          </Text>
          
          <Text style={[styles.tafseerContent, { color: theme.TEXT_PRIMARY }]}>
            {tafseerContent || "Tafseer content is not available for this ayah."}
          </Text>
        </View>
        
        {/* Chat with AI Button */}
        <TouchableOpacity
          style={[styles.chatWithAiButton, { backgroundColor: theme.PRIMARY }]}
          onPress={handleAiTafseer}
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
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'IBMPlexSans_700Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  ayahContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
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
  },
  ayahNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 3,
  },
  ayahNumber: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  ayahTextContainer: {
    flex: 1,
  },
  ayahText: {
    fontSize: 20,
    lineHeight: 34,
    textAlign: 'right',
    fontFamily: 'IBMPlexSans_500Medium',
    marginBottom: 12,
  },
  translationText: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'IBMPlexSans_400Regular',
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  tafseerContainer: {
    marginBottom: 20,
  },
  tafseerLabel: {
    fontSize: 18,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginBottom: 16,
  },
  tafseerContent: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: 'IBMPlexSans_400Regular',
    textAlign: 'left',
  },
  chatWithAiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  chatWithAiButtonText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_500Medium',
    marginLeft: 8,
  }
});

export default TafseerDetailScreen; 