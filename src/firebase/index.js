// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKWcXEA71s3M8ZqgvwzGOc_oij9HP7NrQ",
  authDomain: "presupuesto-electrico.firebaseapp.com",
  projectId: "presupuesto-electrico",
  storageBucket: "presupuesto-electrico.appspot.com",
  messagingSenderId: "14788206965",
  appId: "1:14788206965:web:1a19a404cd6eba418c333c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);



export { db };
export { auth };
