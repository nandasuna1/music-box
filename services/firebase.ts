import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCnf_-PGjA-K9N1SFT1CImmmwXN4mmAzX0",
  authDomain: "music-box-a8b6a.firebaseapp.com",
  projectId: "music-box-a8b6a",
  storageBucket: "music-box-a8b6a.firebasestorage.app",
  messagingSenderId: "843337715350",
  appId: "1:843337715350:web:9041589dd4af91f41f7cb7",
  measurementId: "G-7P4RGCXBF8",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
