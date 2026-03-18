// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCXZEQ2kXM81vDJ8dq0QzRqRp0x8AYle_Q",
  authDomain: "masters-applications-tracker.firebaseapp.com",
  projectId: "masters-applications-tracker",
  storageBucket: "masters-applications-tracker.firebasestorage.app",
  messagingSenderId: "111756155732",
  appId: "1:111756155732:web:417d71eedcb4e5862c86c1",
  measurementId: "G-5KY6LTY0NM"
};


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Multiple tabs open, persistence enabled in first tab only');
        } else if (err.code == 'unimplemented') {
            console.log('Browser doesn\'t support persistence');
        }
    });
