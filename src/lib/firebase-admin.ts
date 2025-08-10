
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

// Define the service account object structure.
interface ServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

// Prepare the service account credentials from environment variables.
const serviceAccountKey = process.env.FIREBASE_PRIVATE_KEY;
const hasCredentials = 
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    serviceAccountKey;

let serviceAccount: ServiceAccount | undefined;

if (hasCredentials) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    // Replace escaped newlines for the private key.
    privateKey: serviceAccountKey!.replace(/\\n/g, '\n'),
  };
}

// Initialize the Firebase Admin SDK.
// This simplified approach ensures the app is initialized only once.
let adminApp: App;
let adminDb: Firestore;
let adminStorage: Storage;

if (getApps().length === 0) {
  if (serviceAccount) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    // In a real-world scenario, you might want to handle this case differently,
    // but for this context, we will mock a simple app if credentials are not present.
    // This avoids crashing the server on startup if env vars are missing.
    console.warn('Firebase Admin credentials are not available. Server-side Firebase features will be disabled.');
    adminApp = initializeApp(); // Initialize without credentials
  }
} else {
  adminApp = getApps()[0];
}

// Export Firestore and Storage instances.
// Assign them only if the app was initialized with credentials.
if (serviceAccount) {
  adminDb = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);
} else {
  // To prevent runtime errors, we assign null if not properly initialized.
  // The actions will then handle this case gracefully.
  // @ts-ignore
  adminDb = null;
  // @ts-ignore
  adminStorage = null;
}

export { adminDb, adminStorage };
