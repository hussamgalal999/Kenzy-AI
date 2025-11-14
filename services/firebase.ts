// Fix: Use scoped packages to prevent module resolution errors.
import { initializeApp, FirebaseApp } from "@firebase/app";
import { getFirestore, Firestore } from "@firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, Auth, updateProfile } from "@firebase/auth";
import { Book } from '../types';

// ==========================================================================================
// TODO: ACTION REQUIRED
// 1. Create a Firebase project at https://console.firebase.google.com/
// 2. Add a new Web App to your project.
// 3. Copy the firebaseConfig object provided by Firebase and paste it here.
//
// For more information, visit: https://firebase.google.com/docs/web/setup#available-libraries
// ==========================================================================================
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let db: Firestore | null = null;
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let isFirebaseConfigured = false;

// Check if the config has been filled out with actual values
if (
    firebaseConfig.apiKey &&
    firebaseConfig.projectId
) {
    try {
        // Initialize Firebase
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        isFirebaseConfigured = true;
        console.log("Firebase configured successfully.");
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        db = null;
        auth = null;
        isFirebaseConfigured = false;
    }
} else {
    console.warn("Firebase is not configured. Please add your credentials to services/firebase.ts. The app will run in offline mode using sample data.");
}

const provider = auth ? new GoogleAuthProvider() : null;

export const signInWithGoogle = () => {
    if (auth && provider) {
        return signInWithPopup(auth, provider);
    }
    return Promise.reject(new Error("Firebase not configured"));
};

export const logout = () => {
    if (auth) {
        return signOut(auth);
    }
    return Promise.resolve();
};

export const onAuthChange = (callback: (user: import('@firebase/auth').User | null) => void) => {
    if (auth) {
        return onAuthStateChanged(auth, callback);
    }
    return () => {}; // Return an empty unsubscribe function if not configured
};

export const updateUserProfile = async (updates: { displayName?: string, photoURL?: string }) => {
    if (auth && auth.currentUser) {
        try {
            await updateProfile(auth.currentUser, updates);
            // Return a new object with the updated info for local state management
            return { ...auth.currentUser, ...updates };
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    }
    throw new Error("No authenticated user found.");
};


export { db, auth, isFirebaseConfigured };