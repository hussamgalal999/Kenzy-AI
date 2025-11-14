import React, { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { onAuthChange, isFirebaseConfigured } from '../services/firebase';
import { User, UserProfile } from '../types';
import { userService } from '../services/userService';
import { DEFAULT_AVATAR_URL } from '../constants';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  setUser: Dispatch<SetStateAction<User | null>>;
  refreshUserProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  setUser: () => {},
  refreshUserProfile: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserProfile = async () => {
    if (user) {
        try {
            const profile = await userService.getOrCreateUserProfile(user.uid);
            setUserProfile(profile);
        } catch (error) {
            console.error("Failed to refresh user profile:", error);
        }
    }
  };


  useEffect(() => {
    if (!isFirebaseConfigured) {
        setLoading(false);
        setUser({
            uid: 'offline-user',
            displayName: 'Hossam Galal',
            email: 'offline@kenzy.ai',
            photoURL: DEFAULT_AVATAR_URL,
            emailVerified: true,
            isAnonymous: false,
            metadata: {},
            providerData: [],
            providerId: 'mock',
            refreshToken: '',
            tenantId: null,
            delete: async () => {},
            getIdToken: async () => '',
            getIdTokenResult: async () => ({} as any),
            reload: async () => {},
            toJSON: () => ({}),
        } as User);
        setUserProfile({ gems: 100, streak: 3, lastActivityDate: new Date().toISOString().split('T')[0], achievements: ['first_book', 'creator'], purchasedAvatars: [] });
        return;
    }

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
          try {
              const profile = await userService.getOrCreateUserProfile(firebaseUser.uid);
              setUserProfile(profile);
          } catch (error) {
              console.error("Failed to get or create user profile:", error);
              setUserProfile(null);
          }
      } else {
          setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, setUser, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
