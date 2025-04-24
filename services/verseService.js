import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Collection of daily verses to rotate through
 */
const dailyVerses = [
  {
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
    translation: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence.",
    surah: "Al-Baqarah",
    ayahNumber: 255,
    surahNumber: 2
  },
  {
    arabic: "إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ وَاخْتِلَافِ اللَّيْلِ وَالنَّهَارِ لَآيَاتٍ لِأُولِي الْأَلْبَابِ",
    translation: "Indeed, in the creation of the heavens and the earth and the alternation of the night and the day are signs for those of understanding.",
    surah: "Al-Imran",
    ayahNumber: 190,
    surahNumber: 3
  },
  {
    arabic: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ",
    translation: "And when My servants ask you concerning Me - indeed I am near.",
    surah: "Al-Baqarah",
    ayahNumber: 186,
    surahNumber: 2
  },
  {
    arabic: "وَلَا تَقْتُلُوا أَنفُسَكُمْ ۚ إِنَّ اللَّهَ كَانَ بِكُمْ رَحِيمًا",
    translation: "And do not kill yourselves [or one another]. Indeed, Allah is to you ever Merciful.",
    surah: "An-Nisa",
    ayahNumber: 29,
    surahNumber: 4
  },
  {
    arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
    translation: "So remember Me; I will remember you. And be grateful to Me and do not deny Me.",
    surah: "Al-Baqarah",
    ayahNumber: 152,
    surahNumber: 2
  },
  {
    arabic: "وَنَفْسٍ وَمَا سَوَّاهَا فَأَلْهَمَهَا فُجُورَهَا وَتَقْوَاهَا",
    translation: "And [by] the soul and He who proportioned it. And inspired it [with discernment of] its wickedness and its righteousness.",
    surah: "Ash-Shams",
    ayahNumber: 7,
    surahNumber: 91
  },
  {
    arabic: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",
    translation: "Read in the name of your Lord who created.",
    surah: "Al-Alaq",
    ayahNumber: 1,
    surahNumber: 96
  }
];

/**
 * Service to handle daily verses
 */
const verseService = {
  /**
   * Get the daily verse
   * @returns {Promise<Object>} - The daily verse
   */
  async getDailyVerse() {
    try {
      // Check if we need to update the daily verse
      const lastUpdated = await AsyncStorage.getItem('dailyVerseLastUpdated');
      const currentVerse = await AsyncStorage.getItem('dailyVerse');
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      // If no verse is set or it's from a previous day, select a new one
      if (!lastUpdated || !currentVerse || parseInt(lastUpdated) < today) {
        // Get a random verse from our collection
        const randomIndex = Math.floor(Math.random() * dailyVerses.length);
        const newVerse = dailyVerses[randomIndex];
        
        // Save the new verse and update timestamp
        await AsyncStorage.setItem('dailyVerse', JSON.stringify(newVerse));
        await AsyncStorage.setItem('dailyVerseLastUpdated', today.toString());
        
        return newVerse;
      } else {
        // Return the current verse
        return JSON.parse(currentVerse);
      }
    } catch (error) {
      console.error('Error getting daily verse:', error);
      // Return the first verse as fallback
      return dailyVerses[0];
    }
  }
};

export default verseService; 