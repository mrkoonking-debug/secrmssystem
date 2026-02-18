
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const env = (import.meta as any).env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDf6mMnM2i3hFCTJznufEDCd6tvzUXaKdc",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "my-sec-claim-system.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "my-sec-claim-system",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "my-sec-claim-system.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "988616933794",
  appId: env.VITE_FIREBASE_APP_ID || "1:988616933794:web:4f8267e73e3269cb05f2fb"
};

const isConfigured =
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.apiKey !== "" &&
  firebaseConfig.projectId !== "your-project-id";

let db: any = null;
let auth: any = null;

if (isConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("🚀 SEC-CLAIM: Connected to Firebase Cloud");
  } catch (e) {
    console.error("❌ Firebase Init Error:", e);
  }
} else {
  console.warn("⚠️ SEC-CLAIM: Running in OFFLINE mode (No Firebase Config)");
}

export { db, auth, isConfigured };
