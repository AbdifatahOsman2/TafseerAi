import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { app } from '../config/firebase';

// Initialize Firestore
const db = getFirestore(app);

/**
 * Loads bookmarks based on user authentication status
 * @param {Object} user - The authenticated user object or null for guest
 * @param {boolean} isGuest - Whether the user is in guest mode
 * @returns {Array} - The bookmarks array
 */
export const loadBookmarks = async (user, isGuest) => {
  try {
    // For guest users, use AsyncStorage
    if (isGuest || !user) {
      const storedBookmarks = await AsyncStorage.getItem('bookmarks');
      if (storedBookmarks) {
        return JSON.parse(storedBookmarks);
      }
      return [];
    }
    
    // For authenticated users, use Firestore
    const bookmarksRef = collection(db, 'users', user.uid, 'bookmarks');
    const querySnapshot = await getDocs(bookmarksRef);
    
    const bookmarks = [];
    querySnapshot.forEach((doc) => {
      bookmarks.push(doc.data());
    });
    
    return bookmarks;
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    return [];
  }
};

/**
 * Saves a bookmark for the user
 * @param {Object} bookmark - The bookmark to save
 * @param {Object} user - The authenticated user object or null for guest
 * @param {boolean} isGuest - Whether the user is in guest mode
 * @returns {boolean} - Success status
 */
export const saveBookmark = async (bookmark, user, isGuest) => {
  try {
    // Ensure the bookmark has a unique ID
    const bookmarkWithId = {
      ...bookmark,
      id: `${bookmark.surah.number}-${bookmark.ayah.numberInSurah}`
    };
    
    // For guest users, use AsyncStorage
    if (isGuest || !user) {
      // Get existing bookmarks
      const existingBookmarksJSON = await AsyncStorage.getItem('bookmarks');
      let bookmarks = existingBookmarksJSON ? JSON.parse(existingBookmarksJSON) : [];
      
      // Check if already bookmarked
      const index = bookmarks.findIndex(b => 
        b.id === bookmarkWithId.id || 
        (b.ayah.number === bookmark.ayah.number)
      );
      
      // If found, update it
      if (index !== -1) {
        bookmarks[index] = bookmarkWithId;
      } else {
        // Otherwise add it
        bookmarks.push(bookmarkWithId);
      }
      
      // Save back to AsyncStorage
      await AsyncStorage.setItem('bookmarks', JSON.stringify(bookmarks));
      return true;
    }
    
    // For authenticated users, use Firestore
    const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', bookmarkWithId.id);
    await setDoc(bookmarkRef, bookmarkWithId);
    return true;
  } catch (error) {
    console.error('Error saving bookmark:', error);
    return false;
  }
};

/**
 * Checks if an ayah is bookmarked
 * @param {Object} ayah - The ayah to check
 * @param {number} surahNumber - The surah number
 * @param {Object} user - The authenticated user object or null for guest
 * @param {boolean} isGuest - Whether the user is in guest mode
 * @returns {boolean} - Whether the ayah is bookmarked
 */
export const isBookmarked = async (ayah, surahNumber, user, isGuest) => {
  try {
    const bookmarkId = `${surahNumber}-${ayah.numberInSurah}`;
    
    // For guest users, use AsyncStorage
    if (isGuest || !user) {
      const existingBookmarksJSON = await AsyncStorage.getItem('bookmarks');
      if (!existingBookmarksJSON) return false;
      
      const bookmarks = JSON.parse(existingBookmarksJSON);
      return bookmarks.some(b => 
        b.id === bookmarkId || 
        (b.ayah.number === ayah.number)
      );
    }
    
    // For authenticated users, check Firestore
    const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', bookmarkId);
    const docSnap = await getDoc(bookmarkRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking bookmark:', error);
    return false;
  }
};

/**
 * Removes a bookmark
 * @param {Object} bookmark - The bookmark to remove
 * @param {Object} user - The authenticated user object or null for guest
 * @param {boolean} isGuest - Whether the user is in guest mode
 * @returns {boolean} - Success status
 */
export const removeBookmark = async (bookmark, user, isGuest) => {
  try {
    const bookmarkId = bookmark.id || `${bookmark.surah.number}-${bookmark.ayah.numberInSurah}`;
    
    // For guest users, use AsyncStorage
    if (isGuest || !user) {
      const existingBookmarksJSON = await AsyncStorage.getItem('bookmarks');
      if (!existingBookmarksJSON) return true;
      
      let bookmarks = JSON.parse(existingBookmarksJSON);
      bookmarks = bookmarks.filter(b => 
        b.id !== bookmarkId && 
        b.ayah.number !== bookmark.ayah.number
      );
      
      await AsyncStorage.setItem('bookmarks', JSON.stringify(bookmarks));
      return true;
    }
    
    // For authenticated users, delete from Firestore
    const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', bookmarkId);
    await deleteDoc(bookmarkRef);
    return true;
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return false;
  }
};

/**
 * Clear local bookmarks (used when logging in/out)
 */
export const clearLocalBookmarks = async () => {
  try {
    await AsyncStorage.removeItem('bookmarks');
    return true;
  } catch (error) {
    console.error('Error clearing bookmarks:', error);
    return false;
  }
}; 