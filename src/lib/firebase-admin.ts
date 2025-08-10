
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

interface AdminInstances {
  app: App;
  db: Firestore;
  storage: Storage;
}

let adminInstances: AdminInstances | null = null;

function initializeAdminApp(): AdminInstances {
  if (adminInstances) {
    return adminInstances;
  }

  const serviceAccountKey = process.env.FIREBASE_PRIVATE_KEY;
  const hasCredentials =
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    serviceAccountKey;

  if (!hasCredentials) {
    throw new Error('As credenciais do Firebase Admin não estão configuradas no ambiente do servidor.');
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: serviceAccountKey!.replace(/\\n/g, '\n'),
  };

  const app = getApps().length > 0 ? getApps()[0] : initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  const db = getFirestore(app);
  const storage = getStorage(app);

  adminInstances = { app, db, storage };
  return adminInstances;
}

export function getAdminDb(): Firestore {
  try {
    const { db } = initializeAdminApp();
    return db;
  } catch (error) {
    // Lançamos um novo erro para garantir que a mensagem seja clara
    // caso a inicialização falhe por falta de credenciais.
    throw new Error('A conexão com o servidor não pôde ser inicializada. Verifique as variáveis de ambiente.');
  }
}

export function getAdminStorage(): Storage {
  const { storage } = initializeAdminApp();
  return storage;
}
