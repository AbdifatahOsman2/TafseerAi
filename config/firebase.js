// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_API_KEY } from '@env';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY || "AIzaSyAYNnB-dsrA_ZcgWMzi1xmcgFXs-XctJGE", // Fallback to hardcoded key if env var fails
  authDomain: "tafseerai.firebaseapp.com",
  projectId: "tafseerai",
  storageBucket: "tafseerai.firebasestorage.app",
  messagingSenderId: "915630919364",
  appId: "1:915630919364:web:99b1c9c437eb60e74fc391",
  measurementId: "G-RS2Y228E01"
};

// The above config contains values that should be replaced with actual values from your environment
// For a production app, consider using a more secure approach than direct environment variables

let app;
let auth;

// Check if Firebase app is already initialized
if (getApps().length === 0) {
  // Initialize Firebase only if no apps exist
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Auth with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  // Use existing app if already initialized
  app = getApps()[0];
  // Auth should already be initialized with the app
}

export { app, auth }; 