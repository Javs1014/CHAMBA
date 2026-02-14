
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

export const firebaseConfig = {
  "projectId": "chamba-b176f",
  "appId": "1:175617081436:web:a51d79be9e5a89e0776699",
  "storageBucket": "chamba-b176f.appspot.com",
  "apiKey": "AIzaSyDg7PJtb0wXxmqpS3yCPZYE-A9H3PgwipE",
  "authDomain": "chamba-b176f.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "175617081436"
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} else if (typeof window !== 'undefined') {
  app = getApp();
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  // Handle server-side case if needed, though most of your usage seems client-side
}


// @ts-ignore
export { db, auth, app };
