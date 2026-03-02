// initialize Firebase app and exports for auth + firestore
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// replace the following with your Firebase project's config; you can keep using env variables or hardcode values for local dev
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDfGre0_t2cUe45jDloR-kmkpIDy0A8gas",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gymshop-dcfb2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gymshop-dcfb2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gymshop-dcfb2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1028444780184",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1028444780184:web:1503f190e904c64c7182ed",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-V4RVW9K1N3",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
