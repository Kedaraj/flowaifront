import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDVG0fJSvPPE2XI-U8nIOkyhu59SpGa9QY",
  authDomain: "flowsupa-ba1d4.firebaseapp.com",
  projectId: "flowsupa-ba1d4",
  storageBucket: "flowsupa-ba1d4.firebasestorage.app",
  messagingSenderId: "118491531030",
  appId: "1:118491531030:web:66d1c391fb2096a7d93237",
  measurementId: "G-65S61DD8RM"
};

// Initialize Firebase Modular (for Auth)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Also set up the global DB object for backwards compatibility with store.js
// The global `firebase` object comes from the compat script tags in HTML.
let db = null;
if (window.firebase) {
  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
  }
  db = window.firebase.firestore();
  window.db = db;
  window.auth = auth; // Expose modular auth to window for main.js logout
} else {
  console.error("Firebase compat library is not loaded. Please ensure script tags are present in HTML.");
}

export { app, auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword };

console.log("Firebase initialized successfully with Auth modules and Firestore compat.");
