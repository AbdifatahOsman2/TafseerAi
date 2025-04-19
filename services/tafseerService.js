import { GEMINI_API_KEY } from '@env';

/**
 * Fetch classical tafseer for a specific ayah using AI instead of external API
 */
export const fetchClassicalTafseer = async (surahNumber, ayahNumber) => {
  try {
    // Instead of using tafseer.com API which returns HTML, 
    // use Gemini to generate a classical-style tafseer explanation
    const prompt = `
      You are a scholar of Quranic tafseer (interpretation). Please provide a very brief classical interpretation of Surah ${surahNumber}, Ayah ${ayahNumber} 
      in the style of traditional tafseer works.
      
      Focus on:
      1. The literal meaning of the ayah in 1-2 sentences
      2. A key view from a major classical scholar like Ibn Kathir, al-Tabari, or al-Qurtubi
      
      IMPORTANT: Keep your response to no more than 3-4 sentences total. Be concise while retaining the scholarly essence.
      Use respectful, academic language.
    `;

    const response = await callGeminiAPI(prompt);
    return { text: response.text };
  } catch (error) {
    console.error('Error generating classical tafseer:', error);
    return { text: "Unable to generate classical tafseer at this time. Please try again later." };
  }
};

/**
 * Fetch metadata about a surah (Meccan/Medinan, themes)
 */
export const fetchSurahMetadata = async (surahNumber) => {
  try {
    // This would ideally use a real API, but for demo purposes we use mock data
    const meccanSurahs = [1, 6, 7, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 25, 26, 27, 28, 29, 30, 31, 32, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 50, 51, 52, 53, 54, 55, 56, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 111, 112, 113, 114];
    
    // Themes for some major surahs
    const surahThemes = {
      1: "Opening, Prayer, Divine Guidance",
      2: "Faith, Law, Past Prophets, Guidance for Humanity",
      3: "Family of Imran, Faith, Trials, Battle of Uhud",
      4: "Women, Social Justice, Family Laws, Inheritance",
      5: "Contracts, Dietary Laws, Faith, The Last Complete Surah",
      6: "Cattle, Monotheism, Creation, Polytheism",
      7: "The Heights, Stories of Prophets, Day of Judgment",
      8: "Spoils of War, Battle of Badr, Faith in Adversity",
      9: "Repentance, Hypocrites, Expedition to Tabuk",
      10: "Jonah, God's Power, Punishment, Guidance",
      // Add more as needed
    };
    
    return {
      isMeccan: meccanSurahs.includes(parseInt(surahNumber)),
      classification: meccanSurahs.includes(parseInt(surahNumber)) ? "Meccan" : "Medinan",
      themes: surahThemes[surahNumber] || "Faith, Guidance, Reflection"
    };
  } catch (error) {
    console.error('Error fetching surah metadata:', error);
    return { 
      classification: "Unknown",
      themes: "Faith, Guidance, Reflection"
    };
  }
};

/**
 * Fetch reasons for revelation (Asbab al-Nuzul)
 */
export const fetchAsbabAlNuzul = async (surahNumber, ayahNumber) => {
  try {
    // This would ideally use a real API, but for demo purposes we use mock data
    return {
      text: "This is a placeholder for the Asbab al-Nuzul (reasons for revelation) of this ayah. In a complete implementation, this would be fetched from a reliable Islamic database."
    };
  } catch (error) {
    console.error('Error fetching Asbab al-Nuzul:', error);
    return { 
      text: "Information about reasons for revelation is not available at this time."
    };
  }
};

/**
 * Generate initial tafseer explanation when an ayah is first selected
 * This provides comprehensive context about the ayah
 */
export const generateInitialAyahExplanation = async (surahNumber, ayahNumber, surahMetadata) => {
  try {
    // Construct the prompt for Gemini
    const prompt = `
      You are an Islamic scholar explaining Quranic verses. Please provide a brief, clear explanation of Surah ${surahNumber}, Ayah ${ayahNumber}.
      
      Context:
      - This is a ${surahMetadata.classification} surah
      - Key themes: ${surahMetadata.themes}
      
      Please provide:
      1. A brief overview of the ayah's meaning (1-2 sentences)
      2. One key lesson or wisdom from this verse (1-2 sentences)
      
      IMPORTANT: Keep your response concise - no more than 3-5 sentences total. Focus on clarity and brevity.
      Format your response clearly for a modern reader seeking to understand the Quran better.
    `;

    // Call Gemini API
    const response = await callGeminiAPI(prompt, "user");

    return response;
  } catch (error) {
    console.error('Error generating initial ayah explanation:', error);
    return { 
      text: "I couldn't generate an explanation for this ayah right now. Please try again later."
    };
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
          console.error(errorMessage);
        } catch (textReadError) {
          console.error('Could not read error response text:', textReadError);
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
        console.error('Unexpected Gemini API response format:', JSON.stringify(data));
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('Network request failed') ||
          error.message.includes('timeout')) {
        console.error('Network error in Gemini API call:', error);
        throw new Error('Network error: Could not connect to the AI service. Please check your internet connection and try again.');
      } else {
        console.error('Error in Gemini API call:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error in ayah conversation:', error);
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
    console.error('Error calling Gemini API:', error);
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