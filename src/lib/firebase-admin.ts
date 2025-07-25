import * as admin from 'firebase-admin';
import { config } from 'dotenv';

config({ path: '.env' });

// As credenciais são lidas das variáveis de ambiente do servidor no arquivo .env
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Garante que a inicialização do app admin só aconteça uma vez
if (!admin.apps.length) {
  try {
     if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } else {
        console.error('Credenciais do Firebase Admin não estão completas. Verifique seu arquivo .env');
    }
  } catch (error) {
    console.error('Falha na inicialização do Firebase Admin:', error);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminStorage = admin.apps.length ? admin.storage() : null;
