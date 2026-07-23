import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYxEz4_SJt9Job7iuSuKwOkOEYC-Loxbk",
  authDomain: "jjcet-nirf-cdefd.firebaseapp.com",
  projectId: "jjcet-nirf-cdefd",
  storageBucket: "jjcet-nirf-cdefd.firebasestorage.app",
  messagingSenderId: "1058920913649",
  appId: "1:1058920913649:web:709d132572f5a855e7a750",
  measurementId: "G-W9CF3269DX",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db, app };
