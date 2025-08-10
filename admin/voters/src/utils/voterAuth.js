import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

// Utility function to create voter accounts
// This should be used by admin to create voter accounts
export const createVoterAccount = async (indexNumber, code) => {
  try {
    const email = `${indexNumber}@voters.edu`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, code);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Error creating voter account:', error);
    return { success: false, error: error.message };
  }
};

// Utility function to validate voter credentials
export const validateVoterCredentials = async (indexNumber, code) => {
  try {
    // This would typically check against Firestore
    // For now, we'll return a mock validation
    return { valid: true, indexNumber, code };
  } catch (error) {
    console.error('Error validating credentials:', error);
    return { valid: false, error: error.message };
  }
};
