// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAYNnB-dsrA_ZcgWMzi1xmcgFXs-XctJGE",
  authDomain: "tafseerai.firebaseapp.com",
  projectId: "tafseerai",
  storageBucket: "tafseerai.firebasestorage.app",
  messagingSenderId: "915630919364",
  appId: "1:915630919364:web:99b1c9c437eb60e74fc391",
  measurementId: "G-RS2Y228E01"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { app, auth }; 