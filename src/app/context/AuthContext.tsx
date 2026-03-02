import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../../firebase';

interface User {
  name: string;
  email: string;
  avatar?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setAdmin: (uid: string, isAdmin: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // helper to convert firebase user + firestore profile to our User type
  const buildUser = (firebaseUser: FirebaseUser, profileData: any): User => {
    return {
      name: profileData?.name || firebaseUser.email?.split('@')[0] || '',
      email: firebaseUser.email || '',
      avatar: profileData?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
      isAdmin: profileData?.isAdmin || false,
    };
  };

  const fetchProfile = async (firebaseUser: FirebaseUser) => {
    console.log('[Auth] fetchProfile for', firebaseUser.uid);
    const docRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(docRef);
    let data: any = null;
    if (snap.exists()) {
      data = snap.data();
      console.log('[Auth] profile data found', data);
    } else {
      // if profile missing (maybe user signed up via other method), create with defaults
      data = {
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
        isAdmin: false,
      };
      console.log('[Auth] creating new profile document', data);
      await setDoc(docRef, data);
      console.log('[Auth] new user profile written to users collection');
    }
    setUser(buildUser(firebaseUser, data));
  };

  const login = async (email: string, password: string) => {
    console.log('[Auth] login attempt', email);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      console.log('[Auth] login success', credential.user.uid);
      await fetchProfile(credential.user);
    } catch (err) {
      console.error('[Auth] login error', err);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log('[Auth] signUp attempt', email);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('[Auth] signUp success', credential.user.uid);
      // write initial profile with isAdmin=false
      const profile = { email, name, isAdmin: false };
      await setDoc(doc(db, 'users', credential.user.uid), profile);
      console.log('[Auth] profile document created at signup');
      setUser(buildUser(credential.user, profile));
    } catch (err) {
      console.error('[Auth] signUp error', err);
      throw err;
    }
  };

  const logout = () => {
    firebaseSignOut(auth);
    setUser(null);
  };

  const setAdmin = async (uid: string, isAdmin: boolean) => {
    await updateDoc(doc(db, 'users', uid), { isAdmin });
    if (user && user.email && uid === auth.currentUser?.uid) {
      setUser({ ...user, isAdmin });
    }
  };

  // listen for auth state changes and sync profile
  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[Auth] auth state change', firebaseUser?.uid);
      if (firebaseUser) {
        await fetchProfile(firebaseUser);
      } else {
        setUser(null);
      }
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signUp,
        logout,
        isAuthenticated: !!user,
        isAdmin: !!user?.isAdmin,
        setAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
