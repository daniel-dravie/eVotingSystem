// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZSNynMm3E4zLWQDYJVZV2PCT-ieMiaE4",
  authDomain: "acedravieproject.firebaseapp.com",
  projectId: "acedravieproject",
  storageBucket: "acedravieproject.appspot.com",
  messagingSenderId: "811658719394",
  appId: "1:811658719394:web:f4cb06e19cc0c7d21527fb",
  measurementId: "G-WL0NPS7Z39"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
