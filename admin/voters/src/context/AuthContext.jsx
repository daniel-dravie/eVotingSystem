
import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voterData, setVoterData] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const savedUser = localStorage.getItem('voterUser');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
        
        // Verify user still exists in database
        try {
          const voterRef = collection(db, 'voters');
          const q = query(voterRef, where('indexNumber', '==', userData.indexNumber));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            localStorage.removeItem('voterUser');
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Error verifying user:', error);
        }
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (indexNumber, code) => {
    setLoading(true);
    try {
      // Validate input format
      if (!/^\d{6}$/.test(indexNumber) || !/^[a-zA-Z0-9]{6}$/.test(code)) {
        return { success: false, error: 'Index number and code must be exactly 6 characters' };
      }

      // Query Firestore voters collection for matching indexNumber and code
      const votersRef = collection(db, 'voters');
      const q = query(votersRef, where('indexNumber', '==', indexNumber), where('code', '==', code));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const voterDoc = querySnapshot.docs[0];
        const voterInfo = voterDoc.data();
        
        // Check if already voted
        if (voterInfo.hasVoted) {
          setLoading(false);
          return { success: false, error: 'You have already voted' };
        }

        const userData = { id: voterDoc.id, ...voterInfo };
        setVoterData(voterInfo);
        setCurrentUser(userData);
        
        // Save to localStorage
        localStorage.setItem('voterUser', JSON.stringify(userData));
        
        setLoading(false);
        return { success: true, voterData: voterInfo };
      } else {
        setLoading(false);
        return { success: false, error: 'Invalid index number or code' };
      }
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setVoterData(null);
    localStorage.removeItem('voterUser');
  };

  const value = {
    currentUser,
    voterData,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

