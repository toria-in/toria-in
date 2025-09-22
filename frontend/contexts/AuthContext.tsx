import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase imports for web (since Firebase Native modules may not work in this environment)
interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from AsyncStorage on app start
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        // For testing: Set a mock authenticated user
        const mockUser = {
          id: 'user-demo-123',
          email: 'demo@toria.com',
          displayName: 'Demo User',
          emailVerified: true
        };
        setUser(mockUser);
        await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      // Fallback: Set mock user even if storage fails
      const mockUser = {
        id: 'user-demo-123',
        email: 'demo@toria.com',
        displayName: 'Demo User',
        emailVerified: true
      };
      setUser(mockUser);
    } finally {
      setLoading(false);
    }
  };

  const saveUserToStorage = async (userData: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // For MVP, create a mock authenticated user
      // In production, this would integrate with Firebase Auth
      const mockUser: User = {
        id: `user-${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        emailVerified: true,
      };
      
      setUser(mockUser);
      await saveUserToStorage(mockUser);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      // For MVP, create a mock authenticated user
      // In production, this would integrate with Firebase Auth
      const mockUser: User = {
        id: `user-${Date.now()}`,
        email,
        displayName,
        emailVerified: false,
      };
      
      setUser(mockUser);
      await saveUserToStorage(mockUser);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};