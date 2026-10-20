// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKWcXEA71s3M8ZqgvwzGOc_oij9HP7NrQ",
  authDomain: "presupuesto-electrico.firebaseapp.com",
  projectId: "presupuesto-electrico",
  storageBucket: "presupuesto-electrico.appspot.com",
  messagingSenderId: "14788206965",
  appId: "1:14788206965:web:1a19a404cd6eba418c333c",

};

// Initialize Firebase
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';
if (useEmulators && import.meta.env.PROD) throw new Error('No se permite publicar un build conectado a emuladores.');
const app = initializeApp(useEmulators ? {
  apiKey: 'demo-api-key', authDomain: 'localhost', projectId: 'demo-presupuesto-electrico'
} : firebaseConfig);
// Initialize Cloud Storage and get a reference to the service

const db = getFirestore(app);
const auth = getAuth(app);
if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}



export { db };
export { auth };
