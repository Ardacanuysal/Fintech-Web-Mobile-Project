import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { createUserProfile } from '../services/firestore';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        if (user.emailVerified) {
          // Only create profile if email is verified
          await createUserProfile(user);
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified
          });
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(user);
    // Don't create profile yet - wait for email verification
  };

  const login = async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    if (!user.emailVerified) {
      await logout();
      throw new Error('Please verify your email before logging in.');
    }
    await createUserProfile(user);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (displayName: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
      setCurrentUser(prev => prev ? { ...prev, displayName } : null);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    updateUserProfile,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};