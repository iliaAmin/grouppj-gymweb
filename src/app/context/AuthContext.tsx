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
import { auth, db } from '../firebase';

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
    const docRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(docRef);
    let data = null;
    if (snap.exists()) {
      data = snap.data();
    } else {
      // if profile missing (maybe user signed up via other method), create with defaults
      data = {
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
        isAdmin: false,
      };
      await setDoc(docRef, data);
    }
    setUser(buildUser(firebaseUser, data));
  };

  const login = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await fetchProfile(credential.user);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // write initial profile with isAdmin=false
    const profile = { email, name, isAdmin: false };
    await setDoc(doc(db, 'users', credential.user.uid), profile);
    setUser(buildUser(credential.user, profile));
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
