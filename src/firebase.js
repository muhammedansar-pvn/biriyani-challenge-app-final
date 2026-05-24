import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app;
let db = null;
let isFirebaseConfigured = false;

// Check if credentials are valid and not placeholders
if (apiKey && apiKey !== "your_api_key" && apiKey !== "placeholder-key" && projectId) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseConfigured = true;
    console.log("Firebase initialized successfully in cloud mode.");
  } catch (error) {
    console.error("Firebase failed to initialize. Running in local-only mode:", error);
    db = null;
    isFirebaseConfigured = false;
  }
} else {
  console.warn("Firebase credentials missing or unconfigured. Running in local-only mode.");
}

export { db, isFirebaseConfigured };
