
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import * as dotenv from 'dotenv';

dotenv.config({ path: './src/.env' });

let adminDb: Firestore;
let adminStorage: Storage;

function initializeAdminApp() {
  const serviceAccountKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!getApps().length) {
    const hasCredentials = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && serviceAccountKey;
    
    if (!hasCredentials) {
        console.error("Firebase Admin credentials not configured in the server environment.");
        return;
    }

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: serviceAccountKey.replace(/\\n/g, '\n'),
    };

    const app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

    adminDb = getFirestore(app);
    adminStorage = getStorage(app);
  } else {
    const app = getApps()[0];
    adminDb = getFirestore(app);
    adminStorage = getStorage(app);
  }
}

// Initialize the app when the module is first imported.
initializeAdminApp();


export function getAdminDb(): Firestore {
  if (!adminDb) {
    // This is a safeguard, but the initialization above should prevent this.
    initializeAdminApp();
    if (!adminDb) {
      throw new Error('A conexão com o servidor não pôde ser inicializada. Verifique as variáveis de ambiente.');
    }
  }
  return adminDb;
}

export function getAdminStorage(): Storage {
  if (!adminStorage) {
    initializeAdminApp();
     if (!adminStorage) {
        throw new Error('A conexão com o servidor não pôde ser inicializada. Verifique as variáveis de ambiente.');
     }
  }
  return adminStorage;
}
