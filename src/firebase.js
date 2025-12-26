import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// താഴെയുള്ള ഭാഗത്ത് നിങ്ങ‌ളുടെ Firebase കൺസോളിൽ നിന്ന് കിട്ടിയ 
// സ്വന്തം "firebaseConfig" കോപ്പി ചെയ്ത് പേസ്റ്റ് ചെയ്യുക.
const firebaseConfig = {
  apiKey: "AIzaSyAmqxzfN1aOrlPXLVA629lrC33y4ei7FUQ",
  authDomain: "underground-net-v2.firebaseapp.com",
  projectId: "underground-net-v2",
  storageBucket: "underground-net-v2.firebasestorage.app",
  messagingSenderId: "1005372859050",
  appId: "1:1005372859050:web:166e1d7fde1f693aaea6d3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firestore
export const db = getFirestore(app);