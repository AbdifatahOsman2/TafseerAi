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
 * Returns approximately 5 sentences with improved formatting
 */
const extractShortTafseer = (text) => {
  try {
    // First, strip HTML tags but preserve paragraph structure
    let strippedText = text.replace(/<p[^>]*>/gi, '\n\n'); // Convert <p> tags to paragraph breaks
    strippedText = strippedText.replace(/<br[^>]*>/gi, '\n'); // Convert <br> tags to line breaks
    strippedText = strippedText.replace(/<[^>]*>/g, ''); // Remove all other HTML tags
    
    // Clean up excessive whitespace and normalize spacing
    strippedText = strippedText.replace(/\s+/g, ' '); // Replace multiple spaces with single space
    strippedText = strippedText.replace(/\n\s*\n/g, '\n\n'); // Normalize paragraph breaks
    strippedText = strippedText.trim();
    
    // Split by sentence endings, but be smarter about it
    const sentences = strippedText.split(/(?<=[.!?])\s+/);
    
    let shortTafseer = '';
    let sentenceCount = 0;
    let charCount = 0;
    const maxChars = 1200; // Increased from 600 to provide more complete content
    const maxSentences = 8; // Increased from 4 to allow for more comprehensive explanations
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;
      
      // Skip very short sentences that are likely not meaningful content
      if (sentence.length < 8) continue;
      
      // Skip sentences that are likely headers or references (but be less aggressive)
      if (sentence.includes(':') && sentence.length < 25) continue;
      
      // Add the sentence with proper spacing
      if (shortTafseer.length > 0) {
        shortTafseer += ' ';
      }
      shortTafseer += sentence;
      sentenceCount++;
      charCount += sentence.length;
      
      // Add paragraph break after every 3 sentences for better readability
      if (sentenceCount % 3 === 0 && i < sentences.length - 1 && charCount < maxChars * 0.8) {
        shortTafseer += '\n\n';
      }
      
      // Only stop if we've exceeded both limits and have meaningful content
      if (sentenceCount >= maxSentences && charCount >= maxChars * 0.6) {
        // Only add ellipsis if there's substantially more content
        if (i < sentences.length - 2) {
          shortTafseer += '...';
        }
        break;
      }
    }
    
    // Final cleanup and formatting
    shortTafseer = shortTafseer.trim();
    
    // Ensure we end with proper punctuation
    if (shortTafseer && !shortTafseer.match(/[.!?…]$/)) {
      shortTafseer += '.';
    }
    
    // If we got very little content, try to get more by being less restrictive
    if (shortTafseer.length < 300 && strippedText.length > 300) {
      // Take first 800 characters and try to end at sentence boundary
      let fallback = strippedText.substring(0, 800);
      const lastSentence = fallback.lastIndexOf('.');
      if (lastSentence > 200) {
        fallback = fallback.substring(0, lastSentence + 1);
      } else {
        fallback += '...';
      }
      return fallback.trim();
    }
    
    return shortTafseer;
  } catch (error) {
    console.log('Error shortening tafseer:', error);
    // Fallback to simple truncation with better formatting
    let fallback = text.replace(/<[^>]*>/g, '').substring(0, 800);
    // Try to end at a sentence boundary
    const lastSentence = fallback.lastIndexOf('.');
    if (lastSentence > 300) {
      fallback = fallback.substring(0, lastSentence + 1);
    } else {
      fallback += '...';
    }
    return fallback.trim();
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
      You are a knowledgeable Islamic scholar providing tafseer (Quranic interpretation) for Muslim families and students.

      Please explain Surah ${surah.englishName} (${surah.name}), Ayah ${ayah.numberInSurah}:
      
      Arabic Text: ${ayah.text}
      Translation: ${translation || "Translation not available"}
      
      Provide a warm, accessible explanation covering:
      
      🔹 **Core Message**: What is ﷲ teaching us in this verse?
      🔹 **Historical Context**: When and why was this revealed?
      🔹 **Life Lessons**: How can we apply this wisdom today?
      🔹 **Connection**: How does this relate to other Quranic teachings?
      
      Guidelines:
      - Use clear, family-friendly language
      - Be respectful and encouraging
      - Include practical guidance for daily life
      - Reference authentic Islamic sources when helpful
      - Always use "ﷲ" instead of "God"
      - Keep explanation concise but meaningful (3-5 paragraphs)
      
      May this explanation bring benefit and increase faith. Ameen.
    `;
    
    // In a real implementation, this would call the Gemini API
    // For now, return a meaningful placeholder that includes ayah info
    return `Bismillah - In the name of ﷲ, the Most Compassionate, the Most Merciful

This is an AI-powered tafseer of Surah ${surah.englishName} (${surah.name}), Ayah ${ayah.numberInSurah}.

🌙 **What This Feature Offers:**
Our AI assistant provides modern, accessible explanations of Quranic verses, drawing from classical Islamic scholarship and making the wisdom relevant for today's Muslim families.

📚 **The Analysis Includes:**
• Clear explanation of the verse's meaning and message
• Historical context and circumstances of revelation
• Practical guidance for applying these teachings in daily life
• Connections to other Quranic verses and Islamic principles

🔧 **Getting Started:**
To access the full AI-powered tafseer, please ensure you have an active internet connection. The system will then provide detailed, scholarly explanations to enhance your understanding of ﷲ's guidance.

May ﷲ bless your journey of learning and increase you in beneficial knowledge. Ameen.`;
  } catch (error) {
    console.log('Error generating AI explanation:', error);
    return "SubhanAllah, we're experiencing some technical difficulties. Please check your internet connection and try again. May ﷲ make this easy for you.";
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
      You are a caring, knowledgeable Islamic scholar assistant specializing in Quranic interpretation and Islamic guidance. 
      
      Current Context: The user is studying Surah ${surah.englishName} (${surah.name}), Ayah ${ayah.number}.
      
      Your Role:
      - Provide scholarly, accurate explanations based on mainstream Sunni Islamic understanding
      - Use warm, encouraging tone suitable for Muslim families and students
      - Answer questions with wisdom, patience, and Islamic etiquette
      - Reference Quran, authentic Hadith, and classical scholars when appropriate
      - Keep responses clear and accessible (2-4 sentences typically)
      - Always use "ﷲ" instead of "God"
      - If asked about non-Islamic topics, kindly redirect to Islamic learning
      
      Remember: You're helping fellow Muslims grow closer to ﷲ through understanding His Book.
    `;
    
    // Format chat history for the API - only include the last 6 messages maximum
    const recentMessages = chatHistory.slice(-6);
    const formattedHistory = formatChatHistory(recentMessages);
    
    // Simplify the conversation structure to avoid potential API issues
    // Gemini doesn't support system role, so we'll use the user role for the instruction
    const enhancedUserMessage = `${systemInstruction}\n\nUser's question about Surah ${surah.englishName}, Ayah ${ayah.number}: "${message}"`;
    
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
      const fetchPromise = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
        throw new Error('Network error: SubhanAllah, having trouble connecting. Please check your internet connection and try again.');
      } else {
        throw error;
      }
    }
  } catch (error) {
    // Return a more helpful error message for debugging
    if (error.message.includes('Network error')) {
      return { 
        text: "SubhanAllah, I'm having trouble connecting right now. Please check your internet connection and try again. May ﷲ make this easy for you! 🤲"
      };
    } else if (error.message.includes('timeout')) {
      return { 
        text: "Patience is a virtue! My response is taking longer than usual. Please try asking again or simplify your question. Barakallahu feeki! ⏰"
      };
    } else {
      return { 
        text: "I'm experiencing some technical difficulties at the moment. Please try again with your question. May ﷲ grant us ease! 💚"
      };
    }
  }
};

/**
 * Helper function to call the Gemini API
 */
const callGeminiAPI = async (prompt, role = "user") => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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