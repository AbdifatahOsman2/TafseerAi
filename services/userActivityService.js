import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { app } from '../config/firebase';

// Initialize Firestore
const db = getFirestore(app);

/**
 * Track user activity and increment days active count if needed
 * @param {Object} user - The authenticated user object or null for guest
 * @param {boolean} isGuest - Whether the user is in guest mode
 * @returns {Object} - The updated activity data
 */
export const trackDailyActivity = async (user, isGuest) => {
  try {
    const today = new Date().toDateString();
    
    // For guest users, use AsyncStorage
    if (isGuest || !user) {
      return await trackGuestActivity(today);
    }
    
    // For authenticated users, use Firestore
    return await trackAuthenticatedUserActivity(user.uid, today);
  } catch (error) {
    console.error('Error tracking user activity:', error);
    return { daysActive: 1, lastVisit: new Date().toISOString() };
  }
};

/**
 * Track activity for guest users using AsyncStorage
 * @param {string} today - Today's date string
 * @returns {Object} - The updated activity data
 */
const trackGuestActivity = async (today) => {
  // Get last visit date from AsyncStorage
  const lastVisitDate = await AsyncStorage.getItem('lastVisitDate');
  let daysActive = 1;
  
  // Check if this is a new day
  if (lastVisitDate && lastVisitDate !== today) {
    // Calculate days active if user is returning on a different day
    const storedDaysActive = await AsyncStorage.getItem('daysActive');
    daysActive = storedDaysActive ? parseInt(storedDaysActive, 10) + 1 : 1;
    await AsyncStorage.setItem('daysActive', daysActive.toString());
  } else if (!lastVisitDate) {
    // First visit
    await AsyncStorage.setItem('daysActive', '1');
  } else {
    // Same day visit, retrieve current days active
    const storedDaysActive = await AsyncStorage.getItem('daysActive');
    daysActive = storedDaysActive ? parseInt(storedDaysActive, 10) : 1;
  }
  
  // Update last visit date
  await AsyncStorage.setItem('lastVisitDate', today);
  
  return {
    daysActive,
    lastVisit: lastVisitDate ? new Date(lastVisitDate).toISOString() : new Date().toISOString()
  };
};

/**
 * Track activity for authenticated users using Firestore
 * @param {string} userId - The user's ID
 * @param {string} today - Today's date string
 * @returns {Object} - The updated activity data
 */
const trackAuthenticatedUserActivity = async (userId, today) => {
  // Reference to the user's activity document
  const userActivityRef = doc(db, 'users', userId, 'userData', 'activity');
  
  // Try to get existing activity data
  const activityDoc = await getDoc(userActivityRef);
  
  if (!activityDoc.exists()) {
    // First login ever - create activity document
    const activityData = {
      daysActive: 1,
      lastVisit: new Date().toISOString(),
      firstVisit: new Date().toISOString(),
      loginDates: [today],
    };
    
    await setDoc(userActivityRef, activityData);
    return activityData;
  } else {
    // Existing user - check if this is a new day
    const activityData = activityDoc.data();
    const lastVisit = activityData.lastVisit;
    const lastVisitDate = new Date(lastVisit).toDateString();
    
    if (lastVisitDate !== today) {
      // New day - increment days active
      await updateDoc(userActivityRef, {
        daysActive: increment(1),
        lastVisit: new Date().toISOString(),
        loginDates: [...(activityData.loginDates || []), today]
      });
      
      return {
        ...activityData,
        daysActive: activityData.daysActive + 1,
        lastVisit: new Date().toISOString()
      };
    } else {
      // Same day - just update last visit timestamp
      await updateDoc(userActivityRef, {
        lastVisit: new Date().toISOString()
      });
      
      return {
        ...activityData,
        lastVisit: new Date().toISOString()
      };
    }
  }
};

/**
 * Get user activity stats
 * @param {Object} user - The authenticated user object or null for guest
 * @param {boolean} isGuest - Whether the user is in guest mode
 * @returns {Object} - The activity data
 */
export const getUserActivityStats = async (user, isGuest) => {
  try {
    // For guest users, use AsyncStorage
    if (isGuest || !user) {
      const daysActive = await AsyncStorage.getItem('daysActive') || '1';
      const lastVisitDate = await AsyncStorage.getItem('lastVisitDate');
      
      return {
        daysActive: parseInt(daysActive, 10),
        lastVisit: lastVisitDate ? new Date(lastVisitDate).toISOString() : new Date().toISOString()
      };
    }
    
    // For authenticated users, use Firestore
    const userActivityRef = doc(db, 'users', user.uid, 'userData', 'activity');
    const activityDoc = await getDoc(userActivityRef);
    
    if (!activityDoc.exists()) {
      // No activity data yet
      return {
        daysActive: 1,
        lastVisit: new Date().toISOString()
      };
    }
    
    return activityDoc.data();
  } catch (error) {
    console.error('Error getting user activity stats:', error);
    return {
      daysActive: 1,
      lastVisit: new Date().toISOString()
    };
  }
};

/**
 * Migrate guest activity to user account
 * @param {string} userId - The authenticated user's ID
 * @returns {boolean} - Success status
 */
export const migrateGuestActivity = async (userId) => {
  try {
    // Get guest activity data from AsyncStorage
    const daysActive = await AsyncStorage.getItem('daysActive') || '1';
    const lastVisitDate = await AsyncStorage.getItem('lastVisitDate');
    
    // Reference to the user's activity document
    const userActivityRef = doc(db, 'users', userId, 'userData', 'activity');
    
    // Check if user already has activity data
    const activityDoc = await getDoc(userActivityRef);
    
    if (!activityDoc.exists()) {
      // Create new activity document with guest data
      await setDoc(userActivityRef, {
        daysActive: parseInt(daysActive, 10),
        lastVisit: new Date().toISOString(),
        firstVisit: lastVisitDate ? new Date(lastVisitDate).toISOString() : new Date().toISOString(),
        loginDates: [new Date().toDateString()],
        migratedFromGuest: true
      });
    } else {
      // Update existing activity data
      // We don't add guest days to existing user's count to avoid inflation
      // Just update the last visit timestamp
      await updateDoc(userActivityRef, {
        lastVisit: new Date().toISOString(),
        migratedFromGuest: true
      });
    }
    
    // Clear guest activity data
    await AsyncStorage.removeItem('daysActive');
    await AsyncStorage.removeItem('lastVisitDate');
    
    return true;
  } catch (error) {
    console.error('Error migrating guest activity:', error);
    return false;
  }
};

/**
 * Track authenticated user login
 * @param {string} userId - The user's ID
 * @returns {boolean} - Success status
 */
export const trackUserLogin = async (userId) => {
  try {
    const userActivityRef = doc(db, 'users', userId, 'userData', 'activity');
    const activityDoc = await getDoc(userActivityRef);
    const now = new Date();
    
    if (!activityDoc.exists()) {
      // First login ever
      await setDoc(userActivityRef, {
        daysActive: 1,
        lastLogin: now.toISOString(),
        firstLogin: now.toISOString(),
        lastVisit: now.toISOString(),
        loginCount: 1,
        logins: [{
          timestamp: now.toISOString(),
          date: now.toDateString()
        }]
      });
    } else {
      // Update existing data
      const data = activityDoc.data();
      const logins = data.logins || [];
      
      // Limit stored login history to last 50 logins to avoid excessive document size
      if (logins.length >= 50) {
        logins.shift(); // Remove oldest login
      }
      
      // Add new login
      logins.push({
        timestamp: now.toISOString(),
        date: now.toDateString()
      });
      
      await updateDoc(userActivityRef, {
        lastLogin: now.toISOString(),
        lastVisit: now.toISOString(),
        loginCount: increment(1),
        logins: logins
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error tracking user login:', error);
    return false;
  }
};

/**
 * Track user logout and update session time
 * @param {string} userId - The user's ID
 * @returns {boolean} - Success status
 */
export const trackUserLogout = async (userId) => {
  try {
    const userActivityRef = doc(db, 'users', userId, 'userData', 'activity');
    const activityDoc = await getDoc(userActivityRef);
    
    if (!activityDoc.exists()) {
      return false;
    }
    
    const now = new Date();
    const data = activityDoc.data();
    
    // Calculate session time if we have a last login timestamp
    if (data.lastLogin) {
      const lastLogin = new Date(data.lastLogin);
      const sessionTimeMs = now.getTime() - lastLogin.getTime();
      const sessionTimeMinutes = Math.round(sessionTimeMs / (1000 * 60));
      
      // Only add meaningful session times (more than 1 minute)
      if (sessionTimeMinutes >= 1) {
        // Update total usage time
        const totalUsageTime = (data.totalUsageMinutes || 0) + sessionTimeMinutes;
        
        await updateDoc(userActivityRef, {
          lastLogout: now.toISOString(),
          lastSessionMinutes: sessionTimeMinutes,
          totalUsageMinutes: totalUsageTime
        });
        
        // If we have logins array, update the last login with session duration
        if (data.logins && data.logins.length > 0) {
          const logins = [...data.logins];
          const lastLogin = logins[logins.length - 1];
          lastLogin.sessionMinutes = sessionTimeMinutes;
          
          await updateDoc(userActivityRef, {
            logins: logins
          });
        }
      } else {
        // Just update the logout time for very short sessions
        await updateDoc(userActivityRef, {
          lastLogout: now.toISOString()
        });
      }
    } else {
      // No last login, just record the logout
      await updateDoc(userActivityRef, {
        lastLogout: now.toISOString()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error tracking user logout:', error);
    return false;
  }
}; 