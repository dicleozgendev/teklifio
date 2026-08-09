import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];

export const isFirebaseConfigured = requiredFirebaseValues.every((value) =>
  Boolean(value && !value.startsWith("your_") && !value.startsWith("your-")),
);

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestore: Firestore | null = null;

export function getFirebaseServices() {
  if (!isFirebaseConfigured) return null;
  firebaseApp ??= getApps().length ? getApp() : initializeApp(firebaseConfig);
  firebaseAuth ??= getAuth(firebaseApp);
  firestore ??= getFirestore(firebaseApp);
  return { app: firebaseApp, auth: firebaseAuth, db: firestore };
}
