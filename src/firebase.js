import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDhxxFVzJM3MtnGuWS-uOXT0oEjteFj_0Y",
    authDomain: "lab-viva-olinda.firebaseapp.com",
    projectId: "lab-viva-olinda",
    storageBucket: "lab-viva-olinda.firebasestorage.app",
    messagingSenderId: "601376652597",
    appId: "1:601376652597:web:2aa2414a8034368e97207c",
    measurementId: "G-CJ0GQ7WEMM"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;