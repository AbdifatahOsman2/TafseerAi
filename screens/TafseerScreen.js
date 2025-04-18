import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  StatusBar, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  Modal,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Initial loading state for surahs
const initialSurahs = [];

// Mock chat messages
const initialMessages = [
  {
    id: '1',
    text: 'Welcome to AI Tafseer. Ask me anything about the Quran and I will try to help you understand it better.',
    sender: 'ai'
  }
];

const TafseerScreen = () => {
  const { theme } = useTheme();
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showSurahModal, setShowSurahModal] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [interactionMode, setInteractionMode] = useState('chat'); // 'chat' or 'ayah'
  const [showAyahSelector, setShowAyahSelector] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState(null);
  const [ayahs, setAyahs] = useState([]);
  const [messages, setMessages] = useState(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showClassicalTafseer, setShowClassicalTafseer] = useState(false);
  const [surahs, setSurahs] = useState(initialSurahs);
  const [loadingSurahs, setLoadingSurahs] = useState(false);
  const scrollViewRef = useRef();
  const flatListRef = useRef();

  // Fetch all surahs from API
  useEffect(() => {
    fetchSurahs();
  }, []);

  const fetchSurahs = async () => {
    setLoadingSurahs(true);
    try {
      const response = await fetch('https://api.alquran.cloud/v1/surah');
      const data = await response.json();
      if (data.code === 200 && data.status === 'OK') {
        setSurahs(data.data);
      } else {
        console.error('Failed to fetch surahs:', data);
        // Fallback to mock data if API fails
        setSurahs([
          { number: 1, name: 'الفاتحة', englishName: 'Al-Fatiha', numberOfAyahs: 7 },
          { number: 2, name: 'البقرة', englishName: 'Al-Baqarah', numberOfAyahs: 286 },
          { number: 3, name: 'آل عمران', englishName: 'Aal-Imran', numberOfAyahs: 200 },
          { number: 4, name: 'النساء', englishName: 'An-Nisa', numberOfAyahs: 176 },
          { number: 5, name: 'المائدة', englishName: 'Al-Ma\'idah', numberOfAyahs: 120 },
        ]);
      }
    } catch (error) {
      console.error('Error fetching surahs:', error);
      // Fallback to mock data if API fails
      setSurahs([
        { number: 1, name: 'الفاتحة', englishName: 'Al-Fatiha', numberOfAyahs: 7 },
        { number: 2, name: 'البقرة', englishName: 'Al-Baqarah', numberOfAyahs: 286 },
        { number: 3, name: 'آل عمران', englishName: 'Aal-Imran', numberOfAyahs: 200 },
        { number: 4, name: 'النساء', englishName: 'An-Nisa', numberOfAyahs: 176 },
        { number: 5, name: 'المائدة', englishName: 'Al-Ma\'idah', numberOfAyahs: 120 },
      ]);
    } finally {
      setLoadingSurahs(false);
    }
  };

  // Generate ayahs when a surah is selected
  useEffect(() => {
    if (selectedSurah) {
      // Use actual numberOfAyahs from API response
      setAyahs(generateAyahs(selectedSurah.numberOfAyahs || selectedSurah.ayahs));
    }
  }, [selectedSurah]);

  // Mock ayah data generator
  const generateAyahs = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      number: i + 1,
      text: `Ayah ${i + 1}`,
      translation: `Translation of Ayah ${i + 1}`
    }));
  };

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleStartTafseer = () => {
    setShowStartScreen(false);
    setShowSurahModal(true);
  };

  const handleSurahSelect = (surah) => {
    setSelectedSurah(surah);
    setShowSurahModal(false);
    if (interactionMode === 'ayah') {
      setShowAyahSelector(true);
    }
  };

  const handleModeChange = (mode) => {
    setInteractionMode(mode);
    if (mode === 'ayah' && selectedSurah) {
      setShowAyahSelector(true);
    } else {
      setShowAyahSelector(false);
    }
  };

  const handleAyahSelect = (ayah) => {
    setSelectedAyah(ayah);
    setShowAyahSelector(false);
    
    // Add a message about the selected ayah
    const newMessage = {
      id: Date.now().toString(),
      text: `You selected Surah ${selectedSurah.englishName}, Ayah ${ayah.number}`,
      sender: 'system'
    };
    setMessages([...messages, newMessage]);
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user'
    };
    
    setMessages([...messages, userMessage]);
    setInputMessage('');
    setLoading(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: `This is a simulated AI response to your question: "${inputMessage}"`,
        sender: 'ai'
      };
      setMessages(prevMessages => [...prevMessages, aiResponse]);
      setLoading(false);
    }, 1500);
    
    Keyboard.dismiss();
  };

  const handleShowClassicalTafseer = () => {
    setShowClassicalTafseer(!showClassicalTafseer);
  };

  const renderSurahItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.surahItem, { borderBottomColor: theme.BORDER }]}
      onPress={() => handleSurahSelect(item)}
    >
      <View style={[styles.surahNumberCircle, { backgroundColor: theme.PRIMARY }]}>
        <Text style={[styles.surahNumberText, { color: theme.WHITE }]}>{item.number}</Text>
      </View>
      <View style={styles.surahItemContent}>
        <Text style={[styles.surahNameText, { color: theme.TEXT_PRIMARY }]}>{item.name}</Text>
        <Text style={[styles.surahEnglishText, { color: theme.TEXT_SECONDARY }]}>{item.englishName}</Text>
      </View>
      <Text style={[styles.surahAyahCount, { color: theme.TEXT_SECONDARY }]}>
        {item.numberOfAyahs || item.ayahs} ayahs
      </Text>
    </TouchableOpacity>
  );

  const renderAyahItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.ayahItem, { 
        borderColor: theme.BORDER,
        backgroundColor: selectedAyah?.number === item.number ? theme.PRIMARY_LIGHT : theme.SURFACE 
      }]}
      onPress={() => handleAyahSelect(item)}
    >
      <View style={[styles.ayahNumberCircle, { backgroundColor: theme.PRIMARY }]}>
        <Text style={[styles.ayahNumberText, { color: theme.WHITE }]}>{item.number}</Text>
      </View>
      <View style={styles.ayahItemContent}>
        <Text style={[styles.ayahText, { color: theme.TEXT_PRIMARY }]}>{item.text}</Text>
        <Text style={[styles.ayahTranslationText, { color: theme.TEXT_SECONDARY }]}>{item.translation}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => {
    let containerStyle, textStyle;
    
    if (item.sender === 'user') {
      containerStyle = [styles.userMessageContainer, { backgroundColor: theme.PRIMARY }];
      textStyle = [styles.messageText, { color: theme.WHITE }];
    } else if (item.sender === 'ai') {
      containerStyle = [styles.aiMessageContainer, { backgroundColor: theme.SURFACE, borderColor: theme.BORDER }];
      textStyle = [styles.messageText, { color: theme.TEXT_PRIMARY }];
    } else {
      containerStyle = [styles.systemMessageContainer, { backgroundColor: theme.SURFACE_SECONDARY }];
      textStyle = [styles.messageText, { color: theme.TEXT_SECONDARY, fontStyle: 'italic' }];
    }
    
    return (
      <View style={[styles.messageRow, { justifyContent: item.sender === 'user' ? 'flex-end' : 'flex-start' }]}>
        <View style={containerStyle}>
          <Text style={textStyle}>{item.text}</Text>
        </View>
      </View>
    );
  };

  // Start Screen
  if (showStartScreen) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND }]}>
        <StatusBar barStyle={theme.DARK ? "light-content" : "dark-content"} />
        <View style={styles.centerContent}>
          <Text style={[styles.titleText, { color: theme.TEXT_PRIMARY }]}>AI Tafseer</Text>
          <Text style={[styles.subtitleText, { color: theme.TEXT_SECONDARY }]}>
            Ask questions about the Quran and get AI-powered explanations
          </Text>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: theme.PRIMARY }]}
            onPress={handleStartTafseer}
          >
            <Text style={[styles.startButtonText, { color: theme.WHITE }]}>Start Tafseer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND }]}>
      <StatusBar barStyle={theme.DARK ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.TEXT_PRIMARY }]}>Tafseer</Text>
        {selectedSurah && (
          <View style={styles.headerSurahInfo}>
            <Text style={[styles.selectedSurahText, { color: theme.TEXT_SECONDARY }]}>
              {selectedSurah.englishName} {selectedAyah ? `- Ayah ${selectedAyah.number}` : ''}
            </Text>
            <TouchableOpacity
              style={[styles.changeSurahButton, { backgroundColor: theme.PRIMARY_LIGHT }]}
              onPress={() => setShowSurahModal(true)}
            >
              <Text style={[styles.changeSurahButtonText, { color: theme.PRIMARY }]}>Change</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {!selectedSurah && (
        <View style={styles.selectSurahPrompt}>
          <Text style={[styles.promptText, { color: theme.TEXT_SECONDARY }]}>
            Please select a Surah to begin
          </Text>
          <TouchableOpacity
            style={[styles.selectSurahButton, { backgroundColor: theme.PRIMARY }]}
            onPress={() => setShowSurahModal(true)}
          >
            <Text style={[styles.buttonText, { color: theme.WHITE }]}>Select Surah</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {selectedSurah && (
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              interactionMode === 'chat' 
                ? { backgroundColor: theme.PRIMARY } 
                : { backgroundColor: theme.SURFACE, borderColor: theme.BORDER }
            ]}
            onPress={() => handleModeChange('chat')}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: interactionMode === 'chat' ? theme.WHITE : theme.TEXT_PRIMARY }
              ]}
            >
              Chat with AI
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              interactionMode === 'ayah' 
                ? { backgroundColor: theme.PRIMARY } 
                : { backgroundColor: theme.SURFACE, borderColor: theme.BORDER }
            ]}
            onPress={() => handleModeChange('ayah')}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: interactionMode === 'ayah' ? theme.WHITE : theme.TEXT_PRIMARY }
              ]}
            >
              Select Specific Ayah
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {showAyahSelector && (
        <View style={styles.ayahSelectorContainer}>
          <View style={styles.ayahSelectorHeader}>
            <Text style={[styles.ayahSelectorTitle, { color: theme.TEXT_PRIMARY }]}>
              Select an Ayah from {selectedSurah.englishName}
            </Text>
            <TouchableOpacity onPress={() => setShowAyahSelector(false)}>
              <MaterialCommunityIcons name="close" size={24} color={theme.TEXT_PRIMARY} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={ayahs}
            renderItem={renderAyahItem}
            keyExtractor={(item) => item.number.toString()}
            style={styles.ayahList}
            contentContainerStyle={styles.ayahListContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
      
      {selectedSurah && (!showAyahSelector || selectedAyah) && (
        <View style={styles.chatContainerWrapper}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.chatContainer}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
              
              {loading && (
                <View style={[styles.loadingContainer, { backgroundColor: theme.SURFACE }]}>
                  <ActivityIndicator size="small" color={theme.PRIMARY} />
                  <Text style={[styles.loadingText, { color: theme.TEXT_SECONDARY }]}>AI is thinking...</Text>
                </View>
              )}
              
              {!loading && messages.length > 1 && messages[messages.length - 1].sender === 'ai' && (
                <TouchableOpacity
                  style={[styles.classicalTafseerButton, { 
                    backgroundColor: showClassicalTafseer ? theme.PRIMARY_LIGHT : theme.SURFACE,
                    borderColor: theme.BORDER
                  }]}
                  onPress={handleShowClassicalTafseer}
                >
                  <Text style={[styles.classicalTafseerButtonText, { color: theme.TEXT_PRIMARY }]}>
                    {showClassicalTafseer ? 'Hide' : 'View'} Classical Tafseer
                  </Text>
                  <MaterialCommunityIcons 
                    name={showClassicalTafseer ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.TEXT_PRIMARY} 
                  />
                </TouchableOpacity>
              )}
              
              {showClassicalTafseer && (
                <View style={[styles.classicalTafseerContainer, { 
                  backgroundColor: theme.SURFACE,
                  borderColor: theme.BORDER
                }]}>
                  <Text style={[styles.classicalTafseerTitle, { color: theme.TEXT_PRIMARY }]}>
                    Classical Tafseer
                  </Text>
                  <Text style={[styles.classicalTafseerText, { color: theme.TEXT_SECONDARY }]}>
                    This is a mock classical tafseer text. In the actual implementation, this would contain the traditional interpretation of the selected ayah from renowned scholars like Ibn Kathir, al-Qurtubi, or al-Tabari.
                    {'\n\n'}
                    The text would provide historical context, linguistic analysis, and related hadiths to give a comprehensive understanding of the verse.
                  </Text>
                </View>
              )}
            </ScrollView>
            
            <View style={[styles.inputContainer, { backgroundColor: theme.SURFACE, borderTopColor: theme.BORDER }]}>
              <TextInput
                style={[styles.input, { color: theme.TEXT_PRIMARY, backgroundColor: theme.BACKGROUND }]}
                placeholder="Ask a question about this Surah..."
                placeholderTextColor={theme.TEXT_TERTIARY}
                value={inputMessage}
                onChangeText={setInputMessage}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: theme.PRIMARY }]}
                onPress={handleSendMessage}
                disabled={inputMessage.trim() === ''}
              >
                <MaterialCommunityIcons name="send" size={20} color={theme.WHITE} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
      
      {/* Surah Selection Modal */}
      <Modal
        visible={showSurahModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSurahModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.BACKGROUND }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.TEXT_PRIMARY }]}>Select a Surah</Text>
              <TouchableOpacity onPress={() => setShowSurahModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>
            
            {loadingSurahs ? (
              <View style={styles.loadingSurahsContainer}>
                <ActivityIndicator size="large" color={theme.PRIMARY} />
                <Text style={[styles.loadingSurahsText, { color: theme.TEXT_SECONDARY }]}>
                  Loading Surahs...
                </Text>
              </View>
            ) : (
              <FlatList
                data={surahs}
                renderItem={renderSurahItem}
                keyExtractor={(item) => item.number.toString()}
                style={styles.surahList}
                contentContainerStyle={styles.surahListContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleText: {
    fontSize: 32,
    fontFamily: 'IBMPlexSans_700Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    maxWidth: 300,
  },
  startButtonText: {
    fontSize: 17,
    fontFamily: 'IBMPlexSans_700Bold',
  },
  header: {
    padding: 16,
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 8,
  },
  headerSurahInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  screenTitle: {
    fontSize: 24,
    fontFamily: 'IBMPlexSans_700Bold',
  },
  selectedSurahText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
  },
  changeSurahButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  changeSurahButtonText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  selectSurahPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  promptText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
    marginBottom: 20,
    textAlign: 'center',
  },
  selectSurahButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  modeSelector: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
  },
  modeButtonText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  ayahSelectorContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  ayahSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ayahSelectorTitle: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  ayahList: {
    flex: 1,
  },
  ayahListContent: {
    paddingBottom: 20,
  },
  ayahItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  ayahNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ayahNumberText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  ayahItemContent: {
    flex: 1,
  },
  ayahText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_500Medium',
  },
  ayahTranslationText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
    marginTop: 2,
  },
  chatContainerWrapper: {
    flex: 1,
    height: '100%',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userMessageContainer: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    borderBottomRightRadius: 4,
  },
  aiMessageContainer: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  systemMessageContainer: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '90%',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginVertical: 8,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'IBMPlexSans_400Regular',
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
    marginLeft: 8,
  },
  classicalTafseerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  classicalTafseerButtonText: {
    fontSize: 15,
    fontFamily: 'IBMPlexSans_500Medium',
    marginRight: 4,
  },
  classicalTafseerContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  classicalTafseerTitle: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginBottom: 8,
  },
  classicalTafseerText: {
    fontSize: 15,
    fontFamily: 'IBMPlexSans_400Regular',
    lineHeight: 22.5, // 1.5x line height
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    fontSize: 15,
    fontFamily: 'IBMPlexSans_400Regular',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: height * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  surahList: {
    flex: 1,
  },
  surahListContent: {
    paddingBottom: 30,
  },
  surahItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  surahNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  surahNumberText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  surahItemContent: {
    flex: 1,
  },
  surahNameText: {
    fontSize: 17,
    fontFamily: 'IBMPlexSans_500Medium',
  },
  surahEnglishText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
    marginTop: 2,
  },
  surahAyahCount: {
    fontSize: 12,
    fontFamily: 'IBMPlexSans_400Regular',
  },
  loadingSurahsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSurahsText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
  },
});

export default TafseerScreen; 