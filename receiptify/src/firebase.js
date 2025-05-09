// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Add this
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMoE2PFwJqypRVj7cx9XSQrTvlCjV__XI",
  authDomain: "csci-5409-receiptify.firebaseapp.com",
  projectId: "csci-5409-receiptify",
  storageBucket: "csci-5409-receiptify.firebasestorage.app",
  messagingSenderId: "628178615538",
  appId: "1:628178615538:web:86a8564cc7737b766be46b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

