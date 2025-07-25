import * as admin from 'firebase-admin';

// As credenciais são lidas das variáveis de ambiente do servidor no arquivo .env
// Note que elas não têm o prefixo NEXT_PUBLIC_
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Garante que a inicialização do app admin só aconteça uma vez
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error('Falha na inicialização do Firebase Admin', error);
  }
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
