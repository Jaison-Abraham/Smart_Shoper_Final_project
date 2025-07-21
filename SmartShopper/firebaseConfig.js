import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1_BFfpYSHLr2ZcGRqPOST3kseurFEHCo",
  authDomain: "info6132project.firebaseapp.com",
  projectId: "info6132project",
  storageBucket: "info6132project.firebasestorage.app",
  messagingSenderId: "868653875929",
  appId: "1:868653875929:web:d1a30a00bb36ed957bf4c8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
