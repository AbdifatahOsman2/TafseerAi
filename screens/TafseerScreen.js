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
    text: 'Assalamu Alaikum! 🌙 Welcome to AI Tafseer, your Islamic learning companion. I\'m here to help you explore and understand the beautiful teachings of the Quran. Feel free to ask about any verse, chapter, or Islamic concept. May ﷲ bless your learning journey!',
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
    
    // Super simplified API key initialization
    const initializeApiKey = async () => {
      try {
        // Just call saveApiKey - it now always saves the fallback key
        await aiService.saveApiKey();
      } catch (error) {
        // Silently fail
      }
    };
    
    // Run initialization
    initializeApiKey();
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

  // Improved keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        
        // Scroll to bottom when keyboard appears with a slight delay
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 50 : 100);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
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
    // This function is kept for backward compatibility
    // The actual formatting is now handled by processAIResponseFormatting
    return text;
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
      // Create comprehensive prompt based on context
      const enhancedUserMessage = createComprehensivePrompt(textToSend, currentChatSurah);
      
      // Use the aiService to generate content with simplified error handling
      let aiResponseText = await aiService.generateContent(enhancedUserMessage);
      
      // Process the response to replace "God" with "ﷲ"
      aiResponseText = processAIResponse(aiResponseText);
      
      // Process formatting for readability
      aiResponseText = processAIResponseFormatting(aiResponseText);
      
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
      // Handle errors gracefully with a user-friendly message
      const generalErrorId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setMessages(prevMessages => {
        const newMessages = [
          ...prevMessages, 
          {
            id: generalErrorId,
            text: "SubhanAllah, I'm having some difficulty responding right now. Please check your internet connection and try asking again. May ﷲ make this easy for you! 🤲",
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

  /**
   * Create comprehensive prompt for AI based on query type and context
   */
  const createComprehensivePrompt = (userQuery, surahContext) => {
    // Analyze query complexity to determine appropriate response length
    const queryComplexity = analyzeQueryComplexity(userQuery);
    
    const basePrompt = `<goal>
You are an Islamic scholar assistant specializing in Quranic interpretation, Islamic theology, and spiritual guidance. Your goal is to provide accurate, scholarly, and accessible answers about Islam, the Quran, Hadith, and Islamic principles. You serve Muslims of all backgrounds - from new learners to advanced students - helping them deepen their understanding of their faith.

You must provide responses that are:
- Grounded in mainstream Sunni Islamic scholarship
- Accessible to diverse Muslim communities (families, students, converts)
- Contextually relevant and practically applicable
- Respectful of traditional Islamic knowledge while being approachable
</goal>

<format_rules>
Structure your responses for optimal readability and digestibility:

Response Length Guidelines:
${queryComplexity.lengthGuideline}

Response Structure:
- Begin with 1-2 sentences that directly address the user's question
- Use short, digestible paragraphs (2-3 sentences maximum per paragraph)
- Add a blank line between paragraphs for better readability
- Use bullet points sparingly and only for clear lists or steps
- End with a practical takeaway or encouragement when appropriate

Content Organization:
- Start with the core answer to the user's question
- Follow with relevant context or background (if needed)
- Include practical application or modern relevance
- Use simple, family-friendly language while maintaining scholarly accuracy

Spacing and Readability:
- Use double line breaks between major points
- Keep sentences concise and clear
- Avoid dense paragraphs - break up long explanations
- Use natural conversation flow

Quranic References:
- When citing verses, format as: "Quran 2:255" or "Surah Al-Baqarah, verse 255"
- Include brief context when referencing verses
- Use "ﷲ" consistently instead of "God" or "Allah"

Emphasis:
- Use *italics* for Arabic terms with brief translations: *Bismillah* (In the name of ﷲ)
- Use **bold** sparingly for key concepts only
- No excessive formatting or emojis
</format_rules>

<restrictions>
NEVER use repetitive Islamic greetings in every response
NEVER start responses with "As a Muslim" or "In Islam"
NEVER include disclaimer language like "I am not a scholar" or "Please consult your local imam"
NEVER provide answers that could be used for sectarian debates
NEVER give specific legal rulings (fiqh) without acknowledging scholarly differences
NEVER use overly academic jargon that alienates general audiences
NEVER repeat the same information if it was covered in recent conversation
NEVER write wall-of-text responses - always use proper spacing and paragraphs
</restrictions>

<query_types>
Based on the user's question type, provide responses tailored to these categories:

${queryComplexity.responseGuidelines}

Quranic Interpretation (Tafseer):
- Start with the verse's main message
- Provide historical context if relevant
- Include practical application for modern life
- Reference classical commentators when helpful

Islamic History:
- Present factual historical information clearly
- Focus on lessons and relevance to modern Muslims
- Acknowledge when details are debated among historians

Spiritual Guidance:
- Offer practical, actionable advice
- Include relevant Quranic verses or authentic Hadith
- Focus on personal spiritual development

Islamic Practices:
- Explain the spiritual purpose behind the practice
- Provide practical guidance for implementation
- Acknowledge differences in scholarly opinion when relevant

General Islamic Knowledge:
- Provide clear, accessible explanations
- Connect concepts to daily Muslim life
- Use relatable examples
</query_types>

<context_integration>
${surahContext ? `Current Context: The user is exploring Surah ${surahContext.englishName} (${surahContext.name}). When relevant, connect responses to this surah's themes and teachings, but don't force connections if the question is about other topics.` : 'The user is asking a general Islamic question. Provide comprehensive guidance without restricting to any specific Quranic chapter.'}

User's Question: "${userQuery}"
</context_integration>

<output>
  Provide a well-formatted, properly spaced response that directly addresses the user's question. Your answer should be informative, practical, and encouraging for the user's Islamic learning journey. Use appropriate length based on question complexity, maintain proper paragraph spacing, and ensure the content is digestible and easy to read.
</output>`;

    return basePrompt;
  };

  /**
   * Analyze query complexity to determine appropriate response guidelines
   */
  const analyzeQueryComplexity = (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Simple questions (what, who, when, basic definitions)
    const simpleKeywords = ['what is', 'who is', 'when was', 'how many', 'which', 'define'];
    const isSimple = simpleKeywords.some(keyword => lowerQuery.includes(keyword)) || query.length < 50;
    
    // Complex questions (explain, why, how, detailed analysis)
    const complexKeywords = ['explain', 'why', 'how does', 'analyze', 'compare', 'discuss', 'elaborate'];
    const isComplex = complexKeywords.some(keyword => lowerQuery.includes(keyword)) || query.length > 100;
    
    // Specific verse or concept questions
    const hasVerseReference = /\b\d+:\d+\b/.test(query) || lowerQuery.includes('ayah') || lowerQuery.includes('verse');
    
    if (isSimple && !isComplex) {
      return {
        lengthGuideline: "Keep response brief and direct (1-2 short paragraphs, 2-3 sentences each). Focus on the essential answer without extensive elaboration.",
        responseGuidelines: "Provide concise, direct answers. Avoid lengthy explanations unless specifically requested."
      };
    } else if (isComplex || hasVerseReference) {
      return {
        lengthGuideline: "Provide a comprehensive but digestible response (2-4 well-spaced paragraphs, 2-3 sentences each). Include context, explanation, and practical application.",
        responseGuidelines: "Offer detailed explanations with proper context. Include background information, practical applications, and relevant examples."
      };
    } else {
      return {
        lengthGuideline: "Provide a balanced response (2-3 paragraphs, 2-3 sentences each). Give sufficient detail while remaining accessible.",
        responseGuidelines: "Balance detail with accessibility. Provide enough information to be helpful without overwhelming the user."
      };
    }
  };

  /**
   * Process AI response to ensure proper formatting and readability
   */
  const processAIResponseFormatting = (text) => {
    let processed = text;
    
    // Replace "God" with "ﷲ"
    processed = processed.replace(/\bGod\b/g, "ﷲ");
    
    // Ensure proper paragraph spacing
    processed = processed.replace(/\n\n\n+/g, '\n\n'); // Remove excessive line breaks
    processed = processed.replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2'); // Add paragraph breaks after sentences before new topics
    
    // Clean up common formatting issues
    processed = processed.replace(/\s+/g, ' '); // Replace multiple spaces with single space
    processed = processed.replace(/\n\s+/g, '\n'); // Remove spaces after line breaks
    processed = processed.trim(); // Remove leading/trailing whitespace
    
    // Ensure sentences don't run too long without breaks
    const sentences = processed.split(/(?<=[.!?])\s+/);
    let formattedText = '';
    let sentenceCount = 0;
    
    for (let i = 0; i < sentences.length; i++) {
      formattedText += sentences[i];
      sentenceCount++;
      
      if (i < sentences.length - 1) {
        // Add paragraph break every 2-3 sentences for better readability
        if (sentenceCount >= 2 && sentences[i + 1] && sentences[i + 1].length > 50) {
          formattedText += '\n\n';
          sentenceCount = 0;
        } else {
          formattedText += ' ';
        }
      }
    }
    
    return formattedText.trim();
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
        text: `MashaAllah! You've selected Surah ${surah.englishName} (${surah.name}) 📖`,
        sender: 'system'
      };
      
      // Add an AI message that clarifies users can ask about anything
      aiConfirmationMessage = {
        id: uniqueAiId,
        text: `Excellent choice! I'm here to help you explore Surah ${surah.englishName} and answer any questions you have. Feel free to ask about this surah or any other Islamic topics - I'm here to support your learning journey! 🌟`,
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
        text: `Switching to Surah ${surah.englishName} (${surah.name}) 🔄 Your previous conversations are saved.`,
        sender: 'system'
      };
      
      // Add an AI message with suggestions specific to this surah
      aiConfirmationMessage = {
        id: uniqueAiId,
        text: `Welcome to Surah ${surah.englishName}! I'm excited to explore this beautiful chapter with you. Here are some questions you might find interesting:`,
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
      textStyle = [styles.messageText, { color: theme.WHITE }];
    } else if (item.sender === 'ai') {
      containerStyle = [styles.aiMessageContainer, { backgroundColor: theme.SURFACE, borderColor: theme.BORDER }];
      textStyle = [styles.messageText, { color: theme.TEXT_PRIMARY }];
    } else {
      containerStyle = [styles.systemMessageContainer, { backgroundColor: theme.SURFACE_SECONDARY }];
      textStyle = [styles.messageText, { color: theme.TEXT_SECONDARY, fontStyle: 'italic' }];
    }
    
    // Check if text contains Arabic characters
    const containsArabic = /[\u0600-\u06FF]/.test(item.text);
    
    return (
      <View style={styles.messageWrapper}>
        <View style={[styles.messageRow, { justifyContent: item.sender === 'user' ? 'flex-end' : 'flex-start' }]}>
          <View style={containerStyle}>
            <Text style={[
              textStyle, 
              containsArabic ? { 
                textAlign: 'right', 
                writingDirection: 'rtl',
                fontWeight: '500'
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
                  style={[styles.messageSuggestionChip, { backgroundColor: theme.PRIMARY_LIGHT, borderColor: theme.PRIMARY }]}
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

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.BORDER }]}>
        <View style={styles.headerTopRow}>
          <Text style={[styles.screenTitle, { color: theme.TEXT_PRIMARY }]}>Tafseer</Text>
          
          <View style={styles.headerButtons}>
            {/* Select Surah button - only show when no surah is selected */}
            {!selectedSurah && (
              <TouchableOpacity
                onPress={() => setShowSurahModal(true)}
                style={[styles.selectSurahHeaderButton, { backgroundColor: theme.PRIMARY }]}
              >
                <MaterialCommunityIcons name="book-open-variant" size={16} color={theme.WHITE} />
                <Text style={[styles.selectSurahHeaderButtonText, { color: theme.WHITE }]}>Select Surah</Text>
              </TouchableOpacity>
            )}
            
            {/* Clear history button */}
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
              style={[styles.clearHistoryButton, { backgroundColor: theme.SURFACE }]}
            >
              <MaterialCommunityIcons name="delete-outline" size={20} color={theme.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>
        </View>
        
        {selectedSurah && (
          <View style={styles.headerSurahInfo}>
            <Text style={[styles.selectedSurahText, { color: theme.TEXT_SECONDARY }]}>
              {selectedSurah.englishName}
            </Text>
            <TouchableOpacity
              style={[styles.changeSurahButton, { backgroundColor: theme.PRIMARY_LIGHT, borderColor: theme.PRIMARY }]}
              onPress={() => setShowSurahModal(true)}
            >
              <Text style={[styles.changeSurahButtonText, { color: theme.PRIMARY }]}>Change</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Chat Container with improved keyboard handling */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages ScrollView */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            { paddingBottom: 16 } // Just enough for the input bar
          ]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }}
        >
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.flatListContent}
          />
          {loading && renderLoadingIndicator()}
        </ScrollView>
        {/* Input Container - Normal flex layout at the bottom */}
        <View style={[
          styles.inputContainer,
          {
            backgroundColor: theme.SURFACE,
            borderTopColor: theme.BORDER,
            shadowColor: theme.SHADOW,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
            paddingBottom: isKeyboardVisible ? 12 : Platform.OS === 'ios' ? 50 : 24, // Account for bottom navigation when keyboard is hidden
          }
        ]}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={[
                styles.input, 
                { 
                  color: theme.TEXT_PRIMARY, 
                  backgroundColor: theme.BACKGROUND,
                  borderColor: theme.BORDER
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
                }, 300);
              }}
            />
            <TouchableOpacity
              style={[
                styles.sendButton, 
                { 
                  backgroundColor: inputMessage.trim() === '' ? theme.PRIMARY_LIGHT : theme.PRIMARY,
                  opacity: inputMessage.trim() === '' ? 0.6 : 1
                }
              ]}
              onPress={() => {
                if (inputMessage.trim() !== '') {
                  handleSendMessage(inputMessage);
                }
              }}
              disabled={inputMessage.trim() === ''}
            >
              <MaterialCommunityIcons 
                name="send" 
                size={18} 
                color={inputMessage.trim() === '' ? theme.PRIMARY : theme.WHITE} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      
      {/* Surah Selection Modal */}
      <Modal
        visible={showSurahModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSurahModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.BACKGROUND }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.BORDER }]}>
              <Text style={[styles.modalTitle, { color: theme.TEXT_PRIMARY }]}>Select a Surah</Text>
              <TouchableOpacity 
                onPress={() => setShowSurahModal(false)}
                style={[styles.modalCloseButton, { backgroundColor: theme.SURFACE }]}
              >
                <MaterialCommunityIcons name="close" size={20} color={theme.TEXT_PRIMARY} />
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
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerSurahInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  screenTitle: {
    fontSize: 18,
    fontFamily: 'IBMPlexSans_700Bold',
  },
  selectedSurahText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_500Medium',
  },
  changeSurahButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  changeSurahButtonText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectSurahHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 32,
  },
  selectSurahHeaderButtonText: {
    fontSize: 13,
    fontFamily: 'IBMPlexSans_600SemiBold',
    marginLeft: 4,
  },
  clearHistoryButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionalSurahPrompt: {
    // Remove this section entirely
    display: 'none',
  },
  promptText: {
    fontSize: 15,
    fontFamily: 'IBMPlexSans_400Regular',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  selectSurahButton: {
    // Remove this section entirely  
    display: 'none',
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: 'IBMPlexSans_500Medium',
    textAlign: 'center',
    paddingTop: 1,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingTop: 16,
    flexGrow: 1,
  },
  flatListContent: {
    paddingBottom: 8,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  userMessageContainer: {
    padding: 16,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  aiMessageContainer: {
    padding: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    maxWidth: '85%',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  systemMessageContainer: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '90%',
    alignSelf: 'center',
    marginVertical: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
    lineHeight: 24,
  },
  loadingIndicatorContainer: {
    padding: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    maxWidth: '50%',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  typingAnimation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  messageSuggestionsContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  suggestionsPrompt: {
    fontSize: 15,
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
    borderRadius: 12,
    width: '48%',
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageSuggestionText: {
    fontSize: 13,
    fontFamily: 'IBMPlexSans_500Medium',
    textAlign: 'center',
    lineHeight: 18,
  },
  systemMessage: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '90%',
    alignSelf: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 15,
    fontFamily: 'IBMPlexSans_400Regular',
    lineHeight: 22,
    textAlign: 'center',
  },
  ayahMessage: {
    padding: 20,
    borderRadius: 16,
    width: '95%',
    alignSelf: 'center',
    marginVertical: 12,
    borderWidth: 1,
  },
  ayahMessageContent: {
    flexDirection: 'column',
  },
  ayahArabicText: {
    fontSize: 22,
    fontFamily: 'IBMPlexSans_500Medium',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 36,
  },
  ayahTranslationText: {
    fontSize: 15,
    fontFamily: 'IBMPlexSans_400Regular',
    lineHeight: 22,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
    maxHeight: 100,
    minHeight: 48,
    borderWidth: 1,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: height * 0.75,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'IBMPlexSans_600SemiBold',
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  surahListContent: {
    paddingBottom: 40,
  },
  surahItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    alignItems: 'center',
  },
  surahNumberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 2,
  },
  surahEnglishText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans_400Regular',
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
  absoluteInputContainer: {
    // removed absolute positioning
    // now handled by inputContainer
    display: 'none',
  },
});

export default TafseerScreen; 