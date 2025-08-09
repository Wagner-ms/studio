
import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const serviceAccountKey = process.env.FIREBASE_PRIVATE_KEY;

// Verifica se as credenciais essenciais estão presentes.
const hasCredentials = 
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    serviceAccountKey;

let app: App;
let adminDb: ReturnType<typeof getFirestore> | null = null;
let adminStorage: ReturnType<typeof getStorage> | null = null;

if (getApps().length === 0) {
  if (hasCredentials) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // A chave privada precisa ter as quebras de linha restauradas.
      privateKey: serviceAccountKey!.replace(/\\n/g, '\n'),
    };
    
    app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    
    adminDb = getFirestore(app);
    adminStorage = getStorage(app);

  } else {
    console.warn('As credenciais do Firebase Admin estão incompletas ou ausentes. As funcionalidades do servidor que dependem do Firebase serão desativadas.');
  }
} else {
  app = getApp();
  adminDb = getFirestore(app);
  adminStorage = getStorage(app);
}

export { adminDb, adminStorage };
