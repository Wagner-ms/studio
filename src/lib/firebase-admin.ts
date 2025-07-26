
'use server';

import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const serviceAccountKey = process.env.FIREBASE_PRIVATE_KEY;
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: serviceAccountKey ? serviceAccountKey.replace(/\\n/g, '\n') : undefined,
};

let adminDb: ReturnType<typeof getFirestore> | null = null;
let adminStorage: ReturnType<typeof getStorage> | null = null;

try {
  if (getApps().length === 0 && serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    initializeApp({
      credential: cert(serviceAccount as any),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  if (getApps().length > 0) {
    adminDb = getFirestore(getApp());
    adminStorage = getStorage(getApp());
  } else {
    console.error('Credenciais do Firebase Admin incompletas ou ausentes. Não foi possível inicializar o app admin.');
  }

} catch (error) {
    console.error('Falha na inicialização do Firebase Admin:', error);
}

export { adminDb, adminStorage };
