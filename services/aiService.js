import { GEMINI_API_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      // Get API key from environment variable first
      let apiKey = GEMINI_API_KEY;

      // If not available (common in production builds), try to get from AsyncStorage
      if (!apiKey) {
        apiKey = await AsyncStorage.getItem('GEMINI_API_KEY');
      }

      // If still no API key, use a hardcoded fallback
      if (!apiKey) {
        // Use the same key as in .env as fallback
        apiKey = 'AIzaSyBwSyxKE_Hlqjo4wJf76PkhOa-XT_KtTLk';
        
        // Try to save it for future use
        try {
          await AsyncStorage.setItem('GEMINI_API_KEY', apiKey);
        } catch (error) {
          // Silent fail if we can't save
        }
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.candidates && 
          data.candidates[0] && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      }
      
      return "I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  },

  /**
   * Save the API key to AsyncStorage
   * This should be called during app initialization
   */
  async saveApiKey() {
    try {
      // Only save if we have an API key from environment
      if (GEMINI_API_KEY) {
        await AsyncStorage.setItem('GEMINI_API_KEY', GEMINI_API_KEY);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving API key:', error);
      return false;
    }
  }
};

export default aiService; 