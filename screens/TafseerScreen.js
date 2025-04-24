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
  Platform,
  Animated,
  InputAccessoryView,
  Alert,
  I18nManager
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GEMINI_API_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import aiService from '../services/aiService';

const { width, height } = Dimensions.get('window');

// Initial loading state for surahs
const initialSurahs = [];

// Mock chat messages
const initialMessages = [
  {
    id: '1',
    text: 'Welcome to AI Tafseer. Ask me anything about the Quran or any specific Surah. You can select a Surah for context, but feel free to discuss other Surahs or topics at any time. Your conversation history will be preserved even when changing Surahs.',
    sender: 'ai'
  }
];

const TafseerScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  
  // UI State
  const [showStartScreen, setShowStartScreen] = useState(false);
  const [showSurahModal, setShowSurahModal] = useState(false);
  
  // Content State
  const [surahs, setSurahs] = useState(initialSurahs);
  const [selectedSurah, setSelectedSurah] = useState(null);
  
  // Chat State
  const [messages, setMessages] = useState(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [currentChatSurah, setCurrentChatSurah] = useState(null);
  
  // Loading State
  const [loading, setLoading] = useState(false);
  const [loadingSurahs, setLoadingSurahs] = useState(false);
  
  // Animation State
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const inputOpacity = useRef(new Animated.Value(1)).current;
  const dot1Opacity = useRef(new Animated.Value(0.4)).current;
  const dot2Opacity = useRef(new Animated.Value(0.4)).current;
  const dot3Opacity = useRef(new Animated.Value(0.4)).current;
  
  // Refs
  const scrollViewRef = useRef();
  const inputRef = useRef(null);

  // Add chat history persistence functions
  const saveChatHistory = async (messages) => {
    try {
      await AsyncStorage.setItem('chatHistory', JSON.stringify(messages));
    } catch (error) {
      // Error handling without console.error
    }
  };

  // Load chat history from AsyncStorage
  useEffect(() => {
    const loadChatHistory = async () => {
      // Skip loading chat history if we're coming from context navigation
      if (route.params && route.params.surahContext) {
        // Coming from surah context
        return;
      }
      
      try {
        const savedHistory = await AsyncStorage.getItem('chatHistory');
        if (savedHistory) {
          setMessages(JSON.parse(savedHistory));
        }
      } catch (error) {
        // Error handling without console.error
      }
    };
    
    // Save API key on app start
    aiService.saveApiKey();
    
    loadChatHistory();
    fetchSurahs();
  }, [route.params]);

  const clearChatHistory = async () => {
    try {
      setMessages([]);
      await AsyncStorage.removeItem('chatHistory');
    } catch (error) {
      // Error handling without console.error
    }
  };

  const fetchSurahs = async () => {
    setLoadingSurahs(true);
    try {
      const response = await fetch('https://api.alquran.cloud/v1/surah');
      const data = await response.json();
      
      if (data.code === 200) {
        setSurahs(data.data);
      } else {
        // Handle API error
      }
    } catch (error) {
      // Error handling without console.error
    } finally {
      setLoadingSurahs(false);
    }
  };

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Add keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        Animated.timing(inputOpacity, {
          toValue: 0.97,
          duration: 200,
          useNativeDriver: true,
        }).start();
        
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
        Animated.timing(inputOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Update the useEffect that handles route params to not worry about showStartScreen
  useEffect(() => {
    if (route.params && (route.params.surahContext || route.params.initialQuestion)) {
      const { surahContext, initialQuestion } = route.params;
      
      // Set the context values if surahContext is provided
      if (surahContext) {
        // Creating a surah object from the surahContext
        const surah = {
          name: surahContext.name,
          englishName: surahContext.englishName,
          number: surahContext.number
        };
        
        setSelectedSurah(surah);
        setCurrentChatSurah(surah);
      }
      
      // If we have an initial question, set it and send automatically after a delay
      if (initialQuestion) {
        setInputMessage(initialQuestion);
        
        // Auto-send the initial question after a short delay
        // to give the UI time to update
        const timer = setTimeout(() => {
          handleSendMessage(initialQuestion);
        }, 500); // Increased delay to ensure UI is ready
        
        return () => clearTimeout(timer);
      }
    }
  }, [route.params]);

  /**
   * Process AI response text to replace instances of "God" with "ﷲ"
   */
  const processAIResponse = (text) => {
    // Replace "God" with "ﷲ" (Allah in Arabic calligraphy)
    return text.replace(/\bGod\b/g, "ﷲ");
  };

  /**
   * Handle user sending a message in the chat
   */
  const handleSendMessage = async (messageText = null) => {
    // Use provided message or input field text
    const textToSend = messageText || inputMessage;
    
    if (textToSend.trim() === '') return;
    
    // Add user message to the chat with unique ID
    const userMessageId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const userMessage = {
      id: userMessageId,
      text: textToSend,
      sender: 'user'
    };
    
    // Update messages with user's message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setLoading(true);
    
    // Save chat history after adding user message
    saveChatHistory(updatedMessages);

    try {
      // Determine if we should include the current surah context
      let enhancedUserMessage;
      
      if (currentChatSurah) {
        // If we have a current surah selected, mention it but don't restrict to it
        enhancedUserMessage = `
          Context: The user has currently selected Surah ${currentChatSurah.englishName} (${currentChatSurah.name}), 
          but they may be asking about any surah or general Quranic knowledge.
          
          User question: ${textToSend}
          
          Answer the question directly. If it's about the currently selected surah, provide specific details.
          If it's about another surah or a general Quranic topic, answer that accordingly without restricting to the current surah.
          
          Format your response in 3-5 concise sentences, being scholarly and helpful.
          
          IMPORTANT: Always use "ﷲ" (Allah) instead of "God" in your response.
        `;
      } else {
        // General Quran prompt if no surah is selected
        enhancedUserMessage = `
          The user is asking a general question about the Quran or Islamic principles.
          Provide a scholarly, concise response based on mainstream Islamic understanding.
          
          User question: ${textToSend}
          
          Keep your response focused on the Quran's teachings, themes, contexts, or other relevant aspects.
          Format your response in 3-5 sentences, being helpful but brief.
          
          IMPORTANT: Always use "ﷲ" (Allah) instead of "God" in your response.
        `;
      }
      
      // Use the aiService to generate content
      let aiResponseText = await aiService.generateContent(enhancedUserMessage);
      
      // Process the response to replace "God" with "ﷲ"
      aiResponseText = processAIResponse(aiResponseText);
      
      // Add AI response to messages with unique ID
      const aiMessageId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setMessages(prevMessages => {
        const newMessages = [
          ...prevMessages, 
          {
            id: aiMessageId,
            text: aiResponseText,
            sender: 'ai',
            showSuggestions: true // Flag to show suggestions after this message
          }
        ];
        
        // Save updated messages including AI response
        saveChatHistory(newMessages);
        
        return newMessages;
      });
      
    } catch (error) {
      // Error handling without console.error
      // Add error message with unique ID
      const generalErrorId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setMessages(prevMessages => {
        const newMessages = [
          ...prevMessages, 
          {
            id: generalErrorId,
            text: "I'm sorry, I couldn't process your request. Please try again.",
            sender: 'ai'
          }
        ];
        
        // Save updated messages including error message
        saveChatHistory(newMessages);
        
        return newMessages;
      });
    } finally {
      setLoading(false);
      // Auto-scroll to the bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    
    Keyboard.dismiss();
  };

  const handleSurahSelect = (surah) => {
    setSelectedSurah(surah);
    setShowSurahModal(false);
    
    // Generate unique IDs
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const uniqueAiId = `${Date.now() + 1}-${Math.floor(Math.random() * 1000)}`;
    const suggestionId = `${Date.now() + 2}-${Math.floor(Math.random() * 1000)}`;
    
    // Add surah selection guidance message
    let surahSelectionMessage;
    let aiConfirmationMessage;
    
    // Check if this is the first surah selected or just changing surahs
    if (!currentChatSurah) {
      // First surah selection
      surahSelectionMessage = {
        id: uniqueId,
        text: `You've selected Surah ${surah.englishName} (${surah.name}).`,
        sender: 'system'
      };
      
      // Add an AI message that clarifies users can ask about anything
      aiConfirmationMessage = {
        id: uniqueAiId,
        text: `I can help with Surah ${surah.englishName}, but feel free to ask about any other surah or Islamic topic as well. Your conversation history will be maintained as you explore different topics.`,
        sender: 'ai',
        showSuggestions: true
      };
      
      // Add both messages
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, surahSelectionMessage, aiConfirmationMessage];
        // Save chat history after adding messages
        saveChatHistory(newMessages);
        return newMessages;
      });
    } else {
      // Changing from one surah to another
      surahSelectionMessage = {
        id: uniqueId,
        text: `You've changed to Surah ${surah.englishName} (${surah.name}). Previous conversation history is preserved.`,
        sender: 'system'
      };
      
      // Add an AI message with suggestions specific to this surah
      aiConfirmationMessage = {
        id: uniqueAiId,
        text: `Here are some suggested questions about Surah ${surah.englishName}:`,
        sender: 'ai',
        showSuggestions: true
      };
      
      // Add messages
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, surahSelectionMessage, aiConfirmationMessage];
        // Save chat history after adding messages
        saveChatHistory(newMessages);
        return newMessages;
      });
    }
    
    // Set current chat surah context
    setCurrentChatSurah(surah);
    
    // Scroll to the bottom after updating messages
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Add this effect for typing animation
  useEffect(() => {
    if (loading) {
      // Set up repeating animation for typing dots
      const animateDots = () => {
        // Sequence for dot 1
        Animated.sequence([
          Animated.timing(dot1Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot1Opacity, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          })
        ]).start();
        
        // Sequence for dot 2 with delay
        setTimeout(() => {
          Animated.sequence([
            Animated.timing(dot2Opacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Opacity, {
              toValue: 0.4,
              duration: 400,
              useNativeDriver: true,
            })
          ]).start();
        }, 150);
        
        // Sequence for dot 3 with delay
        setTimeout(() => {
          Animated.sequence([
            Animated.timing(dot3Opacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot3Opacity, {
              toValue: 0.4,
              duration: 400,
              useNativeDriver: true,
            })
          ]).start(() => {
            // Restart animation after all dots have animated
            if (loading) {
              animateDots();
            }
          });
        }, 300);
      };
      
      animateDots();
    }
  }, [loading]);

  // Get contextual suggestions based on current surah and previous messages
  const getContextualSuggestions = (surah, prevMessages) => {
    if (!surah) {
      // General Quran questions when no surah is selected
      return [
        {
          id: 'general-themes',
          text: 'What are the main themes of the Quran?'
        },
        {
          id: 'general-structure',
          text: 'How is the Quran structured?'
        },
        {
          id: 'general-revelation',
          text: 'How was the Quran revealed?'
        },
        {
          id: 'general-preservation',
          text: 'How has the Quran been preserved?'
        },
        {
          id: 'general-miracles',
          text: 'What are some linguistic miracles in the Quran?'
        },
        {
          id: 'general-tafseer',
          text: 'What are the different approaches to tafseer?'
        },
        {
          id: 'general-stories',
          text: 'What prophets are mentioned in the Quran?'
        },
        {
          id: 'general-science',
          text: 'Are there scientific references in the Quran?'
        }
      ].sort(() => 0.5 - Math.random()).slice(0, 4);
    }
    
    // Get the most recent AI message to analyze context
    const recentAiMessages = prevMessages
      .filter(msg => msg.sender === 'ai')
      .slice(-2);
    
    // Basic context detection
    const messageTexts = recentAiMessages.map(msg => msg.text.toLowerCase());
    const mentionsThemes = messageTexts.some(txt => txt.includes('theme') || txt.includes('topic'));
    const mentionsHistory = messageTexts.some(txt => txt.includes('history') || txt.includes('context') || txt.includes('revealed'));
    const mentionsRelevance = messageTexts.some(txt => txt.includes('today') || txt.includes('modern') || txt.includes('relevance'));
    
    // Generate two random ayah numbers from this surah
    const ayahCount = surah.numberOfAyahs || 10;
    const randomAyah1 = Math.floor(Math.random() * ayahCount) + 1;
    let randomAyah2 = Math.floor(Math.random() * ayahCount) + 1;
    
    // Ensure we have different ayahs
    while (randomAyah2 === randomAyah1 && ayahCount > 1) {
      randomAyah2 = Math.floor(Math.random() * ayahCount) + 1;
    }
    
    // Pool of possible suggestions
    const surahSuggestions = [
      {
        id: 'surah-theme',
        text: 'What are the main themes of this surah?',
        category: 'theme'
      },
      {
        id: 'surah-context',
        text: 'What is the historical context of this surah?',
        category: 'history'
      },
      {
        id: 'surah-relevance',
        text: 'How is this surah relevant today?',
        category: 'relevance'
      },
      {
        id: 'surah-order',
        text: 'Why is this surah placed where it is in the Quran?',
        category: 'structure'
      },
      {
        id: 'surah-name',
        text: `Why is Surah ${surah.englishName} named this way?`,
        category: 'name'
      },
      {
        id: 'surah-lessons',
        text: 'What life lessons can we learn from this surah?',
        category: 'relevance'
      },
      {
        id: 'surah-compare',
        text: 'How does this surah compare to others with similar themes?',
        category: 'comparison'
      },
      {
        id: 'other-surahs',
        text: 'Which other surahs are related to this one?',
        category: 'related'
      },
      {
        id: 'general-question',
        text: 'Tell me about another surah in the Quran',
        category: 'general'
      }
    ];
    
    const ayahSuggestions = [
      {
        id: `ayah-meaning-${randomAyah1}`,
        text: `What is the meaning of ayah ${randomAyah1}?`,
        category: 'ayah'
      },
      {
        id: `ayah-context-${randomAyah1}`,
        text: `What is the context of ayah ${randomAyah1}?`,
        category: 'ayah'
      },
      {
        id: `ayah-meaning-${randomAyah2}`,
        text: `Can you explain ayah ${randomAyah2} of this surah?`,
        category: 'ayah'
      },
      {
        id: `ayah-relevance-${randomAyah2}`,
        text: `How is ayah ${randomAyah2} relevant today?`,
        category: 'ayah'
      }
    ];
    
    // Filter suggestions to avoid repeating categories that were recently discussed
    const filteredSurahSuggestions = surahSuggestions.filter(suggestion => {
      if (suggestion.category === 'theme' && mentionsThemes) return false;
      if (suggestion.category === 'history' && mentionsHistory) return false;
      if (suggestion.category === 'relevance' && mentionsRelevance) return false;
      return true;
    });
    
    // Combine and get exactly 4 suggestions
    const combinedSuggestions = [...filteredSurahSuggestions, ...ayahSuggestions];
    
    // Shuffle the array to get random selection
    const shuffled = combinedSuggestions.sort(() => 0.5 - Math.random());
    
    // Return exactly 4 suggestions
    return shuffled.slice(0, 4);
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

  const renderMessage = ({ item, index }) => {
    if (item.sender === 'system') {
      return (
        <View style={[styles.systemMessage, { backgroundColor: theme.SURFACE_VARIANT }]}>
          <Text style={[styles.systemMessageText, { color: theme.TEXT_SECONDARY }]}>
            {item.text}
          </Text>
        </View>
      );
    } else if (item.sender === 'ayah') {
      // Special rendering for ayah messages
      const parts = item.text.split('\n\n');
      const arabicText = parts[0];
      const translationText = parts[1] || '';
      
      return (
        <View style={[styles.ayahMessage, { backgroundColor: theme.PRIMARY_LIGHT, borderColor: theme.PRIMARY }]}>
          <View style={styles.ayahMessageContent}>
            <Text style={[styles.ayahArabicText, { color: theme.TEXT_PRIMARY }]}>
              {arabicText}
            </Text>
            {translationText && (
              <Text style={[styles.ayahTranslationText, { color: theme.TEXT_SECONDARY }]}>
                {translationText}
              </Text>
            )}
          </View>
        </View>
      );
    }
    
    let containerStyle, textStyle;
    const isLastMessage = index === messages.length - 1;
    
    if (item.sender === 'user') {
      containerStyle = [styles.userMessageContainer, { backgroundColor: theme.PRIMARY }];
      textStyle = [styles.messageText, { color: theme.WHITE, fontFamily: 'IBMPlexSans_400Regular' }];
    } else if (item.sender === 'ai') {
      containerStyle = [styles.aiMessageContainer, { backgroundColor: theme.SURFACE, borderColor: theme.BORDER }];
      textStyle = [styles.messageText, { color: theme.TEXT_PRIMARY, fontFamily: 'IBMPlexSans_400Regular' }];
    } else {
      containerStyle = [styles.systemMessageContainer, { backgroundColor: theme.SURFACE_SECONDARY }];
      textStyle = [styles.messageText, { color: theme.TEXT_SECONDARY, fontStyle: 'italic', fontFamily: 'IBMPlexSans_400Regular' }];
    }
    
    // Check if text contains Arabic characters
    const containsArabic = /[\u0600-\u06FF]/.test(item.text);
    
    return (
      <View>
        <View style={[styles.messageRow, { justifyContent: item.sender === 'user' ? 'flex-end' : 'flex-start' }]}>
          <View style={containerStyle}>
            <Text style={[
              textStyle, 
              containsArabic ? { 
                textAlign: 'right', 
                writingDirection: 'rtl',
                fontFamily: 'IBMPlexSans_500Medium'
              } : {}
            ]}>
              {item.text}
            </Text>
          </View>
        </View>
        
        {/* Show suggestions after AI messages with the showSuggestions flag and if it's the last message */}
        {item.sender === 'ai' && item.showSuggestions && isLastMessage && !loading && (
          <View style={styles.messageSuggestionsContainer}>
            <Text style={[styles.suggestionsPrompt, { color: theme.TEXT_SECONDARY }]}>
              You might want to ask about:
            </Text>
            <View style={styles.messageSuggestionChips}>
              {/* Get exactly 4 contextual suggestions */}
              {getContextualSuggestions(currentChatSurah, messages).map(suggestion => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={[styles.messageSuggestionChip, { backgroundColor: theme.PRIMARY_LIGHT }]}
                  onPress={() => {
                    // Only set the input message, don't send it automatically
                    setInputMessage(suggestion.text);
                    // Focus the input to show the keyboard
                    inputRef.current?.focus();
                  }}
                >
                  <Text style={[styles.messageSuggestionText, { color: theme.PRIMARY }]}>
                    {suggestion.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderLoadingIndicator = () => {
    return (
      <View style={styles.messageRow}>
        <View style={[styles.loadingIndicatorContainer, { 
          backgroundColor: theme.SURFACE,
          borderColor: theme.BORDER
        }]}>
          <View style={styles.typingAnimation}>
            <Animated.View style={[styles.typingDot, { 
              backgroundColor: theme.PRIMARY, 
              opacity: dot1Opacity 
            }]} />
            <Animated.View style={[styles.typingDot, { 
              backgroundColor: theme.PRIMARY, 
              opacity: dot2Opacity 
            }]} />
            <Animated.View style={[styles.typingDot, { 
              backgroundColor: theme.PRIMARY, 
              opacity: dot3Opacity 
            }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND }]}>
      <StatusBar barStyle={theme.DARK ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={[styles.screenTitle, { color: theme.TEXT_PRIMARY }]}>Tafseer</Text>
          
          {/* Add clear history button */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Clear Chat History",
                "Are you sure you want to clear your chat history? This cannot be undone.",
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  { 
                    text: "Clear", 
                    onPress: () => {
                      clearChatHistory();
                    },
                    style: "destructive"
                  }
                ]
              )
            }}
            style={styles.clearHistoryButton}
          >
            <MaterialCommunityIcons name="delete-outline" size={22} color={theme.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>
        
        {selectedSurah && (
          <View style={styles.headerSurahInfo}>
            <Text style={[styles.selectedSurahText, { color: theme.TEXT_SECONDARY }]}>
              {selectedSurah.englishName}
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
        <View style={styles.optionalSurahPrompt}>
          <Text style={[styles.promptText, { color: theme.TEXT_SECONDARY }]}>
            Select a specific Surah or ask any general question about the Quran
          </Text>
          <TouchableOpacity
            style={[styles.selectSurahButton, { backgroundColor: theme.PRIMARY }]}
            onPress={() => setShowSurahModal(true)}
          >
            <Text style={[styles.buttonText, { color: theme.WHITE }]}>Select a Surah</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={styles.chatContainerWrapper}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={[
              styles.messagesContent,
              {paddingBottom: isKeyboardVisible ? 20 : 20}
            ]}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              if (isKeyboardVisible) {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }
            }}
          >
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
            
            {loading && renderLoadingIndicator()}
          </ScrollView>
          
          <Animated.View 
            style={[
              styles.inputContainer, 
              { 
                backgroundColor: theme.SURFACE, 
                borderTopColor: theme.BORDER,
                opacity: inputOpacity,
                shadowColor: theme.SHADOW,
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: isKeyboardVisible ? 0.1 : 0,
                shadowRadius: 5,
                elevation: isKeyboardVisible ? 3 : 0,
              }
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[
                styles.input, 
                { 
                  color: theme.TEXT_PRIMARY, 
                  backgroundColor: theme.BACKGROUND 
                }
              ]}
              placeholder={selectedSurah 
                ? "Ask a question about this Surah..." 
                : "Ask anything about the Quran..."}
              placeholderTextColor={theme.TEXT_TERTIARY}
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
              scrollEnabled
              autoCorrect={true}
              spellCheck={true}
              returnKeyType="default"
              keyboardAppearance={theme.DARK ? 'dark' : 'light'}
              enablesReturnKeyAutomatically={true}
              maxLength={1000}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
            />
            <TouchableOpacity
              style={[
                styles.sendButton, 
                { 
                  backgroundColor: inputMessage.trim() === '' ? theme.PRIMARY_LIGHT : theme.PRIMARY,
                  opacity: inputMessage.trim() === '' ? 0.7 : 1
                }
              ]}
              onPress={() => {
                if (inputMessage.trim() !== '') {
                  handleSendMessage(inputMessage);
                }
              }}
              disabled={inputMessage.trim() === ''}
            >
              <MaterialCommunityIcons name="send" size={20} color={theme.WHITE} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
      
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  keyboardAvoidView: {
    flex: 1,
    width: '100%',
  },
  chatContainerWrapper: {
    flex: 1,
    height: '100%',
    marginBottom: 50,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    flexGrow: 1,
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
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 0.5,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: Platform.OS === 'ios' ? 0 : 0,
    zIndex: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
    maxHeight: 80,
    minHeight: 40,
    paddingTop: 12,
    paddingBottom: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
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
  loadingIndicatorContainer: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: '50%',
    borderWidth: 1,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  typingAnimation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginHorizontal: 2,
  },
  messageSuggestionsContainer: {
    padding: 16,
    marginBottom: 10,
  },
  suggestionsPrompt: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginBottom: 12,
  },
  messageSuggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  messageSuggestionChip: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
  },
  messageSuggestionText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_500Medium',
    textAlign: 'center',
  },
  systemMessage: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '90%',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 15,
    fontFamily: 'IBMPlexSans_400Regular',
    lineHeight: 22,
  },
  ayahMessage: {
    padding: 16,
    borderRadius: 16,
    width: '95%',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginVertical: 12,
    borderWidth: 1,
  },
  ayahMessageContent: {
    flexDirection: 'column',
  },
  ayahArabicText: {
    fontSize: 20,
    fontFamily: 'IBMPlexSans_500Medium',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 32,
  },
  ayahTranslationText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
    lineHeight: 20,
  },
  optionalSurahPrompt: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  clearHistoryButton: {
    padding: 8,
    borderRadius: 8,
  },
});

export default TafseerScreen; 