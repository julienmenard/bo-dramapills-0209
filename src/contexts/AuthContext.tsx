import React, { createContext, useContext, useEffect, useState } from 'react';
import { sesameAuth } from '../lib/sesame';

interface SesameUser {
  id: string;
  email: string;
  name: string;
  role: string;
  accessToken: string;
}

interface AuthContextType {
  user: SesameUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SesameUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Sesame Auth and check for existing session
    const initializeAuth = async () => {
      try {
        // Check if user is already authenticated
        const isAuthenticated = await sesameAuth.isAuthenticated();
        
        if (isAuthenticated) {
          const userInfo = await sesameAuth.getUserInfo();
          const accessToken = await sesameAuth.getAccessToken();
          
          const sesameUser: SesameUser = {
            id: userInfo.sub || userInfo.id,
            email: userInfo.email,
            name: userInfo.name || userInfo.preferred_username || userInfo.email,
            role: userInfo.role || 'admin', // Default role or extract from token claims
            accessToken: accessToken
          };
          
          setUser(sesameUser);
        }
      } catch (error) {
        console.error('Error initializing Sesame Auth:', error);
        // Clear any invalid session data
        await sesameAuth.signOut();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async () => {
    try {
      // Redirect to Sesame authentication
      await sesameAuth.signIn();
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await sesameAuth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}