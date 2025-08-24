import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const firebaseConfig = {
    apiKey: "AIzaSyB_6LUu_oKkNHeJmNg1F5YoJJKQ9RFJAhk",
    authDomain: "nanoconnect-7ba2e.firebaseapp.com",
    projectId: "nanoconnect-7ba2e",
    storageBucket: "nanoconnect-7ba2e.firebasestorage.app",
    messagingSenderId: "644712339813",
    appId: "1:644712339813:web:fc6cb4cb6daa6fe073698c",
    measurementId: "G-8ZQBRSX360",
    databaseURL: "https://nanoconnect-7ba2e-default-rtdb.asia-southeast1.firebasedatabase.app"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const auth = getAuth(app);

  return {
    provide: {
      firebaseApp: app,
      firebaseDb: db,
      firebaseAuth: auth
    }
  };
});