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

  // Function to parse and format tafseer content with enhanced formatting
  const parseTafseerContent = (content) => {
    if (!content) return (
      <Text style={[styles.tafseerParagraph, { color: theme.TEXT_SECONDARY, fontStyle: 'italic' }]}>
        Tafseer content is not available for this ayah.
      </Text>
    );
    
    // Handle potential truncation indicators and clean up the content
    let cleanContent = content;
    
    // Remove common truncation patterns that might cut off important content
    cleanContent = cleanContent.replace(/\.{3,}$/g, ''); // Remove trailing ellipsis
    cleanContent = cleanContent.replace(/\[truncated\]$/gi, ''); // Remove truncation indicators
    
    // Split paragraphs more intelligently - preserve natural breaks
    const paragraphs = cleanContent
      .split(/\n\s*\n/) // Split on double newlines (paragraph breaks)
      .filter(p => p.trim().length > 5) // Filter out very short segments
      .map(p => p.replace(/\n/g, ' ').trim()); // Convert single newlines to spaces
    
    return paragraphs.map((paragraph, index) => {
      if (!paragraph.trim()) return null;
      
      return (
        <View key={index} style={styles.paragraphContainer}>
          {renderFormattedParagraph(paragraph, index)}
        </View>
      );
    }).filter(Boolean);
  };

  // Enhanced function to render a paragraph with proper formatting and verse detection
  const renderFormattedParagraph = (paragraph, index) => {
    // Enhanced patterns to detect Qur'an verses
    const versePatterns = [
      // Quoted verses (most common)
      /"([^"]+)"/g,
      /'([^']+)'/g,
      // Arabic verses (contains Arabic characters)
      /([\u0600-\u06FF\s]+)/g,
      // Verses with reference numbers like (2:255) or [3:104]
      /([^\.\n]+)[\s]*[\(\[]?\d+:\d+[\)\]]?/g,
    ];
    
    let formattedContent = [];
    let lastIndex = 0;
    let hasVerses = false;
    
    // Check for quoted content (most reliable verse indicator)
    const quotedMatches = [...paragraph.matchAll(/"([^"]+)"/g)];
    
    if (quotedMatches.length > 0) {
      quotedMatches.forEach((match, i) => {
        // Add text before the quote
        if (match.index > lastIndex) {
          const beforeText = paragraph.substring(lastIndex, match.index);
          if (beforeText.trim()) {
            formattedContent.push(
              <Text key={`before-${i}`} style={[styles.tafseerText, { color: theme.TEXT_PRIMARY }]}>
                {formatTextWithBold(beforeText)}
              </Text>
            );
          }
        }
        
        // Add the quoted verse with special styling
        formattedContent.push(
          <View key={`verse-${i}`} style={styles.verseContainer}>
            <Text style={[styles.verseText, { color: theme.TEXT_PRIMARY }]}>
              {formatTextWithBold(match[1])}
            </Text>
          </View>
        );
        
        lastIndex = match.index + match[0].length;
        hasVerses = true;
      });
      
      // Add remaining text after the last quote
      if (lastIndex < paragraph.length) {
        const remainingText = paragraph.substring(lastIndex);
        if (remainingText.trim()) {
          formattedContent.push(
            <Text key="remaining" style={[styles.tafseerText, { color: theme.TEXT_PRIMARY }]}>
              {formatTextWithBold(remainingText)}
            </Text>
          );
        }
      }
    } else {
      // No quotes found, check for Arabic text (potential verses)
      const arabicMatches = [...paragraph.matchAll(/([\u0600-\u06FF][^\n\.\?!]*)/g)];
      
      if (arabicMatches.length > 0) {
        let currentIndex = 0;
        
        arabicMatches.forEach((match, i) => {
          // Add text before Arabic
          if (match.index > currentIndex) {
            const beforeText = paragraph.substring(currentIndex, match.index);
            if (beforeText.trim()) {
              formattedContent.push(
                <Text key={`before-ar-${i}`} style={[styles.tafseerText, { color: theme.TEXT_PRIMARY }]}>
                  {formatTextWithBold(beforeText)}
                </Text>
              );
            }
          }
          
          // Add Arabic text with verse styling
          formattedContent.push(
            <View key={`arabic-${i}`} style={styles.arabicVerseContainer}>
              <Text style={[styles.arabicVerseText, { color: theme.TEXT_PRIMARY }]}>
                {match[1]}
              </Text>
            </View>
          );
          
          currentIndex = match.index + match[0].length;
          hasVerses = true;
        });
        
        // Add remaining text
        if (currentIndex < paragraph.length) {
          const remainingText = paragraph.substring(currentIndex);
          if (remainingText.trim()) {
            formattedContent.push(
              <Text key="remaining-ar" style={[styles.tafseerText, { color: theme.TEXT_PRIMARY }]}>
                {formatTextWithBold(remainingText)}
              </Text>
            );
          }
        }
      } else {
        // No special formatting needed, just regular text
        formattedContent.push(
          <Text key="regular" style={[styles.tafseerText, { color: theme.TEXT_PRIMARY }]}>
            {formatTextWithBold(paragraph)}
          </Text>
        );
      }
    }
    
    return (
      <View style={hasVerses ? styles.paragraphWithVerses : styles.regularParagraph}>
        {formattedContent}
      </View>
    );
  };

  // Helper function to format text with bold styling for special words
  const formatTextWithBold = (text) => {
    // Bold important Islamic terms
    const formattedText = text.replace(/\b(Allah|ﷲ|Prophet|Muhammad|Quran|Qur'an|Islam|Islamic)\b/g, "*$1*");
    const segments = formattedText.split('*');

    return segments.map((segment, idx) => {
      return idx % 2 === 1 ? (
        <Text key={idx} style={styles.boldText}>{segment}</Text>
      ) : (
        segment
      );
    });
  };

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
          
          <View style={[styles.tafseerContentContainer, { 
            backgroundColor: theme.SURFACE_VARIANT || 'rgba(0,0,0,0.02)',
            borderColor: theme.BORDER || 'rgba(0,0,0,0.05)'
          }]}>
            <View style={styles.tafseerTextWrapper}>
              {parseTafseerContent(tafseerContent)}
            </View>
          </View>
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
    flexGrow: 1,
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
    flexShrink: 0,
  },
  ayahNumber: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  ayahTextContainer: {
    flex: 1,
    minWidth: 0, // Prevents overflow issues
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
    flex: 1,
  },
  tafseerLabel: {
    fontSize: 18,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginBottom: 16,
  },
  tafseerContentContainer: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 100,
    flex: 1,
  },
  tafseerTextWrapper: {
    flex: 1,
    width: '100%',
  },
  tafseerParagraph: {
    fontSize: 17,
    lineHeight: 30,
    fontFamily: 'IBMPlexSans_400Regular',
    textAlign: 'left',
    marginBottom: 24,
    paddingHorizontal: 4,
    flexWrap: 'wrap',
  },
  boldText: {
    fontFamily: 'IBMPlexSans_700Bold',
    fontWeight: 'bold',
    color: 'inherit',
  },
  chatWithAiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    marginTop: 20,
  },
  chatWithAiButtonText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_500Medium',
    marginLeft: 8,
  },
  paragraphContainer: {
    marginBottom: 24,
  },
  regularParagraph: {
    marginBottom: 8,
  },
  paragraphWithVerses: {
    marginBottom: 16,
  },
  verseContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)', // Subtle green background for verses
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    alignSelf: 'stretch',
  },
  verseText: {
    fontSize: 17,
    lineHeight: 28,
    fontFamily: 'IBMPlexSans_500Medium',
    fontStyle: 'italic',
    color: 'inherit',
  },
  arabicVerseContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)', // Subtle green background for Arabic verses
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    alignSelf: 'stretch',
  },
  arabicVerseText: {
    fontSize: 18,
    lineHeight: 32,
    fontFamily: 'IBMPlexSans_500Medium',
    textAlign: 'right',
    color: 'inherit',
  },
  tafseerText: {
    fontSize: 17,
    lineHeight: 30,
    fontFamily: 'IBMPlexSans_400Regular',
    textAlign: 'left',
    paddingHorizontal: 2,
    marginBottom: 4,
  }
});

export default TafseerDetailScreen; 