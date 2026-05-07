// Firebase Configuration (Compat version for global namespace use)
// Replaced with new project config provided by the user.
const firebaseConfig = {
  apiKey: "AIzaSyDVG0fJSvPPE2XI-U8nIOkyhu59SpGa9QY",
  authDomain: "flowsupa-ba1d4.firebaseapp.com",
  projectId: "flowsupa-ba1d4",
  storageBucket: "flowsupa-ba1d4.firebasestorage.app",
  messagingSenderId: "118491531030",
  appId: "1:118491531030:web:66d1c391fb2096a7d93237",
  measurementId: "G-65S61DD8RM"
};

// Initialize Firebase (called after SDKs are loaded via script tags)
let app, db, auth, analytics;

function initFirebase() {
  if (typeof firebase !== 'undefined') {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    
    // Initialize auth if the script is included
    if (firebase.auth) {
      auth = firebase.auth();
    }
    
    // Initialize analytics if the script is included
    if (firebase.analytics) {
      analytics = firebase.analytics();
    }
    
    // Enable offline persistence
    db.enablePersistence()
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Firebase: Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('Firebase: The current browser does not support persistence.');
        }
      });
    
    console.log('Firebase initialized successfully with new flowsupa-ba1d4 config');
  } else {
    console.error('Firebase SDK not loaded. Make sure firebase-app-compat.js and firebase-firestore-compat.js are included before this script.');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFirebase);
} else {
  initFirebase();
}
