import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCaYH9O8Whuh90Jvp6l6kv4_EjYXRh_h1Y",
  authDomain: "unix-fintech-app.firebaseapp.com",
  projectId: "unix-fintech-app",
  storageBucket: "unix-fintech-app.firebasestorage.app",
  messagingSenderId: "37698974595",
  appId: "1:37698974595:web:3a9af2c59eae6d09bcbcb6",
  measurementId: "G-MQRG33KLPB"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app; 