import { GEMINI_API_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Obfuscate the API key by splitting it into parts
// This isn't perfect security, but makes it harder to extract the key
const keyParts = [
  "AIza",
  "SyBw",
  "SyxK",
  "E_Hl",
  "qjo4",
  "wJf7",
  "6Pkh",
  "Oa-X",
  "T_Kt",
  "TLk"
];

/**
 * Service to handle AI API calls
 */
const aiService = {
  /**
   * Call the Gemini API to generate content
   * @param {string} prompt - The prompt to send to the API
   * @returns {Promise<string>} - The generated response
   */
  async generateContent(prompt) {
    try {
      // Get the API key
      let apiKey = await this.getApiKey();

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
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
        const errorText = await response.text();
        console.error(`API error: ${response.status}`, errorText);
        return "SubhanAllah, there seems to be a technical issue. Please try again in a moment. May ﷲ make this easy for you! 🤲";
      }
      
      const data = await response.json();
      
      if (data.candidates && 
          data.candidates[0] && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      }
      
      return "I'm having difficulty understanding right now. Please try rephrasing your question. Barakallahu feeki! 💚";
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return "SubhanAllah, I'm experiencing some connectivity issues. Please check your internet connection and try again. May ﷲ grant you ease! 🌙";
    }
  },

  /**
   * Get the API key, first from storage then fallback to constructed key
   */
  async getApiKey() {
    try {
      // ALWAYS prioritize env var if available, over storage
      if (GEMINI_API_KEY && GEMINI_API_KEY !== 'undefined') {
        return GEMINI_API_KEY;
      }
      
      // Try to get from AsyncStorage as fallback
      const storedKey = await AsyncStorage.getItem('GEMINI_API_KEY');
      if (storedKey) {
        return storedKey;
      }
      
      // Last resort: construct from parts
      const constructedKey = keyParts.join('');
      return constructedKey;
    } catch (error) {
      // If all else fails, return the constructed key directly
      return keyParts.join('');
    }
  },

  /**
   * Save the API key to AsyncStorage
   * This should be called during app initialization
   */
  async saveApiKey() {
    try {
      // Check if we already have a stored key
      const existingKey = await AsyncStorage.getItem('GEMINI_API_KEY');
      if (existingKey) {
        return true;
      }
      
      // Try env var first
      if (GEMINI_API_KEY) {
        await AsyncStorage.setItem('GEMINI_API_KEY', GEMINI_API_KEY);
        return true;
      }
      
      // Use constructed key as fallback
      const constructedKey = keyParts.join('');
      await AsyncStorage.setItem('GEMINI_API_KEY', constructedKey);
      return true;
    } catch (error) {
      console.error('Error saving API key:', error);
      return false;
    }
  }
};

export default aiService; 