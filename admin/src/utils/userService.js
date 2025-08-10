import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Creates a user document in Firestore "users" collection.
 * @param {string} uid - The Firebase Authentication user ID.
 * @param {string} email - The user's email.
 * @param {string} role - The user's role (e.g., "Admin", "Staff").
 * @param {object} additionalData - Any additional data to store.
 * @returns {Promise<void>}
 */
export const createUser = async (uid, email, role, additionalData = {}) => {
  if (!uid || !email || !role) {
    throw new Error("uid, email, and role are required to create a user.");
  }

  const userRef = doc(db, "users", uid);
  const userData = {
    email,
    role,
    createdAt: serverTimestamp(),
    ...additionalData,
  };

  await setDoc(userRef, userData);
};
