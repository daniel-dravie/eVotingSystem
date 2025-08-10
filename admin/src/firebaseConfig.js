import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * TODO: Replace the following with your app's Firebase project configuration.
 * You can find this information in your Firebase project settings.
 * Make sure to keep this file secure and do not commit real credentials to public repos.
 */
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

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
const storage = getStorage(app);

export { auth, db, storage };
