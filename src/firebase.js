import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// താഴെയുള്ള ഭാഗത്ത് നിങ്ങ‌ളുടെ Firebase കൺസോളിൽ നിന്ന് കിട്ടിയ 
// സ്വന്തം "firebaseConfig" കോപ്പി ചെയ്ത് പേസ്റ്റ് ചെയ്യുക.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firestore
export const db = getFirestore(app);