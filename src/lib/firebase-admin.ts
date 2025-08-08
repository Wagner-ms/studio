
import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const serviceAccountKey = process.env.FIREBASE_PRIVATE_KEY;
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: serviceAccountKey ? serviceAccountKey.replace(/\\n/g, '\n') : undefined,
};

let app: App;

if (getApps().length === 0) {
  if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    app = initializeApp({
      credential: cert(serviceAccount as any),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    console.warn('Credenciais do Firebase Admin incompletas ou ausentes. O app admin não será inicializado no servidor.');
    // Criamos um objeto `app` "mock" para evitar que a aplicação quebre em ambientes sem credenciais.
    // As chamadas ao DB e Storage falharão com mensagens de erro claras.
    app = {} as App; 
  }
} else {
  app = getApp();
}

const adminDb = app.name ? getFirestore(app) : null;
const adminStorage = app.name ? getStorage(app) : null;

export { adminDb, adminStorage };
