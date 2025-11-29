import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyD-GIU-_XMDNkFNyYpBGfrcuAqypNCboxk",
    authDomain: "mit-mess-23f98.firebaseapp.com",
    projectId: "mit-mess-23f98",
    storageBucket: "mit-mess-23f98.firebasestorage.app",
    messagingSenderId: "286644195454",
    appId: "1:286644195454:web:97f456209765291e37082f",
    measurementId: "G-2TSYYR3ZYM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { db, auth };
