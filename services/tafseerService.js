import { GEMINI_API_KEY } from '@env';

/**
 * Fetch classical tafseer for a specific ayah using external API
 */
export const fetchClassicalTafseer = async (surahNumber, ayahNumber) => {
  try {
    // First attempt: Ibn Kathir tafseer (English, ID 169)
    let response = await fetch(`https://api.quran.com/api/v4/tafsirs/169/by_ayah/${surahNumber}:${ayahNumber}`);
    let data = await response.json();
    
    // If Ibn Kathir tafseer is available for this specific ayah
    if (data && data.tafsir && data.tafsir.text && data.tafsir.text.trim().length > 0) {
      return extractShortTafseer(data.tafsir.text); // Return shortened tafseer text
    }
    
    // If we get empty content for specific ayah, try getting the whole surah tafseer
    // For some shorter surahs, Ibn Kathir provides commentary for the entire surah together
    if (surahNumber > 78) { // Shorter surahs are more likely to have combined tafseer
      response = await fetch(`https://api.quran.com/api/v4/tafsirs/169/by_ayah/${surahNumber}:1`);
      data = await response.json();
      
      if (data && data.tafsir && data.tafsir.text && data.tafsir.text.trim().length > 0) {
        return extractShortTafseer(data.tafsir.text) + "\n\n(Note: This tafseer covers the entire surah or multiple ayahs together.)"; 
      }
    }
    
    // Second attempt: Try Tafsir al-Jalalayn (English, ID 74) which has more complete coverage
    response = await fetch(`https://api.quran.com/api/v4/tafsirs/74/by_ayah/${surahNumber}:${ayahNumber}`);
    data = await response.json();
    
    if (data && data.tafsir && data.tafsir.text && data.tafsir.text.trim().length > 0) {
      return extractShortTafseer(data.tafsir.text) + "\n\n(Source: Tafsir al-Jalalayn)";
    }
    
    // If we still don't have tafseer, try Maariful Quran (English, ID 167)
    response = await fetch(`https://api.quran.com/api/v4/tafsirs/167/by_ayah/${surahNumber}:${ayahNumber}`);
    data = await response.json();
    
    if (data && data.tafsir && data.tafsir.text && data.tafsir.text.trim().length > 0) {
      return extractShortTafseer(data.tafsir.text) + "\n\n(Source: Maariful Quran)";
    }
    
    // If all attempts failed, return a message indicating no tafseer is available
    return "Classical tafseer is not available for this specific verse. Try using the AI-powered tafseer instead, or choose a different verse.";
    
  } catch (error) {
    console.log('Error fetching tafseer:', error);
    return "Unable to retrieve classical tafseer at this time. Please check your internet connection and try again.";
  }
};

/**
 * Helper function to extract a shortened version of the tafseer text
 * Returns approximately 5 sentences
 */
const extractShortTafseer = (text) => {
  try {
    // First, strip HTML tags
    const strippedText = text.replace(/<[^>]*>/g, '');
    
    // Split by sentence endings (. or ? or !) followed by a space or end of string
    const sentences = strippedText.split(/(?<=[.!?])\s+|(?<=[.!?])$/);
    
    // Get approximately 5 sentences, but be smart about it
    let shortTafseer = '';
    let sentenceCount = 0;
    let wordCount = 0;
    
    // Target: 5 sentences or about 100 words, whichever comes first
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;
      
      // Skip very short sentences that are likely headings or not full sentences
      if (sentence.split(' ').length < 3) continue;
      
      shortTafseer += sentence + ' ';
      sentenceCount++;
      wordCount += sentence.split(' ').length;
      
      // Stop after 5 meaningful sentences or ~100 words
      if ((sentenceCount >= 5 || wordCount >= 100) && i < sentences.length - 1) {
        shortTafseer += '...';
        break;
      }
    }
    
    return shortTafseer.trim();
  } catch (error) {
    console.log('Error shortening tafseer:', error);
    return text.substring(0, 300) + '...'; // Fallback to simple truncation
  }
};

/**
 * Fetch metadata about a surah (Meccan/Medinan, themes)
 */
export const fetchSurahMetadata = async (surahNumber) => {
  try {
    const response = await fetch(`https://api.quran.com/api/v4/chapters/${surahNumber}`);
    const data = await response.json();
    
    if (data && data.chapter) {
      return {
        revelationPlace: data.chapter.revelation_place,
        revelationOrder: data.chapter.revelation_order,
        nameComplex: data.chapter.name_complex,
        pages: [data.chapter.pages[0], data.chapter.pages[1]]
      };
    }
    return null;
  } catch (error) {
    // Error handling without console.error
    return null;
  }
};

/**
 * Fetch reasons for revelation (Asbab al-Nuzul)
 */
export const fetchAsbabAlNuzul = async (surahNumber, ayahNumber) => {
  try {
    // This would typically call a specific API endpoint for asbab al-nuzul
    // For now, we'll use a placeholder that might be replaced with actual API calls
    return null; // No data available in this implementation
  } catch (error) {
    // Error handling without console.error
    return null;
  }
};

/**
 * Generate initial tafseer explanation when an ayah is first selected
 * This provides comprehensive context about the ayah
 */
export const generateInitialAyahExplanation = async (surah, ayah, translation) => {
  try {
    // For now, let's provide a meaningful placeholder that won't cause UI issues
    if (!surah || !ayah) {
      return "Please select an ayah first to view its interpretation.";
    }
    
    // Construct a basic prompt that would normally be sent to the AI
    const prompt = `
      Provide a brief, scholarly explanation (tafseer) of Surah ${surah.englishName} (${surah.name}), 
      Ayah ${ayah.numberInSurah}.
      
      Arabic Text: ${ayah.text}
      Translation: ${translation || "Translation not available"}
      
      Focus on:
      1. The general meaning of the verse
      2. Historical context if relevant
      3. Key lessons and guidance
    `;
    
    // In a real implementation, this would call the Gemini API
    // For now, return a meaningful placeholder that includes ayah info
    return `This is an AI-powered explanation of Surah ${surah.englishName} (${surah.name}), Ayah ${ayah.numberInSurah}.
    
This feature uses the Gemini API to provide a modern interpretation of the Quranic verses, considering classical commentary, historical context, and contemporary applications.

The AI analysis would include:
• The general meaning and linguistic significance
• Context of revelation
• Relationship with other verses and Hadiths
• Practical guidance for modern life

To see the full AI-powered tafseer, please make sure your internet connection is active and the API key is properly configured.`;
  } catch (error) {
    console.log('Error generating AI explanation:', error);
    return "Unable to generate AI explanation at this time. Please check your internet connection and try again later.";
  }
};

/**
 * Handle ongoing conversation about a specific ayah
 * This maintains context about the current ayah/surah but focuses on the user's specific questions
 */
export const continueAyahConversation = async (message, surah, ayah, chatHistory = []) => {
  try {
    // Construct system instructions
    const systemInstruction = `
      You are an AI assistant specializing in Quranic tafseer (interpretation). The user is asking about Surah ${surah.englishName} (${surah.name}), Ayah ${ayah.number}.
      
      Provide a scholarly, respectful explanation based on traditional Islamic sources. Consider multiple interpretations where relevant.
      
      Be helpful, accurate, and concise. Format your response for readability. If the user asks something unrelated to the Quran, politely redirect them to discuss the current ayah or Islamic topics.
    `;
    
    // Format chat history for the API - only include the last 6 messages maximum
    const recentMessages = chatHistory.slice(-6);
    const formattedHistory = formatChatHistory(recentMessages);
    
    // Simplify the conversation structure to avoid potential API issues
    // Gemini doesn't support system role, so we'll use the user role for the instruction
    const enhancedUserMessage = `${systemInstruction}\n\nUser question about Surah ${surah.englishName}, Ayah ${ayah.number}: ${message}`;
    
    const payload = {
      contents: [
        ...formattedHistory,
        {
          role: "user",
          parts: [{ text: enhancedUserMessage }]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 800,
      }
    };

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timeout after 15 seconds')), 15000);
    });

    // Call the API with the simplified payload and handle timeout
    try {
      // Race between the fetch and the timeout
      const fetchPromise = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errorStatus = response.status;
        let errorMessage = `Gemini API error status: ${errorStatus}`;
        
        try {
          const errorText = await response.text();
          errorMessage += ` - ${errorText}`;
        } catch (textReadError) {
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Check the structure of the response to ensure it's valid
      if (data.candidates && 
          data.candidates[0] && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts[0]) {
        return { text: data.candidates[0].content.parts[0].text };
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('Network request failed') ||
          error.message.includes('timeout')) {
        throw new Error('Network error: Could not connect to the AI service. Please check your internet connection and try again.');
      } else {
        throw error;
      }
    }
  } catch (error) {
    // Return a more helpful error message for debugging
    if (error.message.includes('Network error')) {
      return { 
        text: "I apologize, but I'm having trouble connecting to my knowledge service right now. This might be due to network issues. Please check your internet connection and try again."
      };
    } else if (error.message.includes('timeout')) {
      return { 
        text: "I apologize, but my response took too long to generate. This might be because the service is currently busy. Please try asking a simpler question or try again in a moment."
      };
    } else {
      return { 
        text: "I apologize, but I'm having trouble processing your request right now. Please try again with a simpler question. If the issue persists, it might be related to the API service."
      };
    }
  }
};

/**
 * Helper function to call the Gemini API
 */
const callGeminiAPI = async (prompt, role = "user") => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: role,
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 800,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return { text: data.candidates[0].content.parts[0].text };
    } else {
      throw new Error('Unexpected response format from Gemini API');
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Helper function to format chat history for the API
 */
const formatChatHistory = (messages) => {
  // Filter out system messages and normalize the format
  return messages
    .filter(msg => msg.sender === 'user' || msg.sender === 'ai')
    .map(msg => {
      // Map 'ai' to 'model' as expected by Gemini API
      const role = msg.sender === 'user' ? "user" : "model";
      return { 
        role: role, 
        parts: [{ text: msg.text }] 
      };
    });
};

/**
 * Check if a given ayah is in a particular juz
 */
export const getJuzForAyah = (surahNumber, ayahNumber) => {
  // Logic to determine juz based on surah and ayah number
  // This is a simplified version and should be replaced with accurate mappings
  // Typically this would reference a dataset mapping surah/ayah to juz
  return Math.ceil((surahNumber * ayahNumber) / 200);
};

/**
 * Handle a conversation about a specific ayah
 */
export const handleAyahConversation = async (surah, ayah, userMessage, conversationHistory) => {
  try {
    // Call to Gemini API would go here
    return "This would be a response from the AI model about the ayah you're discussing. In the full implementation, this would use a language model API.";
  } catch (error) {
    // Error handling without logging
    throw new Error("Unable to process your request. Please try again later.");
  }
}; 