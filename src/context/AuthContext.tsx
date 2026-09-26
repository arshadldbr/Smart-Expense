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
      const loggedUser = await loginWithEmailPassword(email, password);
      storageService.initForUser(loggedUser.uid, loggedUser.email, loggedUser.displayName);
      setUser(loggedUser);
    } catch (err: any) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err?.code || err?.message || 'Login failed');
      throw new Error(friendlyMsg);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const newUser = await registerWithEmailPassword(email, password, displayName);
      storageService.initForUser(newUser.uid, newUser.email, displayName || newUser.displayName);
      setUser(newUser);
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
