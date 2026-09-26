import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  registerWithEmailPassword,
  loginWithEmailPassword,
  logoutUser,
  sendPasswordReset,
  getFriendlyAuthErrorMessage,
} from '../services/firebase';
import { storageService } from '../services/storageService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      try {
        if (currentUser) {
          storageService.initForUser(
            currentUser.uid,
            currentUser.email,
            currentUser.displayName
          );
          setUser(currentUser);
        } else {
          storageService.initForUser(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Error in onAuthStateChanged listener:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Firebase's auth-state observer is the single source of truth for the
      // authenticated user. Avoid setting user twice, which can cause a render
      // race immediately after a successful mobile sign-in/sign-up.
      await loginWithEmailPassword(email, password);
    } catch (err: any) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err?.code || err?.message || 'Login failed');
      throw new Error(friendlyMsg);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      // createUserWithEmailAndPassword also triggers onAuthStateChanged.
      // Let that observer initialize the user-scoped storage and UI exactly once.
      await registerWithEmailPassword(email, password, displayName);
    } catch (err: any) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err?.code || err?.message || 'Registration failed');
      throw new Error(friendlyMsg);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      storageService.initForUser(null);
      setUser(null);
    } catch (err: any) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err?.code || err?.message || 'Logout failed');
      throw new Error(friendlyMsg);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordReset(email);
    } catch (err: any) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err?.code || err?.message || 'Password reset failed');
      throw new Error(friendlyMsg);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
