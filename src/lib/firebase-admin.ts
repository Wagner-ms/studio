
import * as admin from 'firebase-admin';

// Garante que a inicialização do app admin só aconteça uma vez
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
    );
      
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    // Log de erro se as credenciais estiverem incompletas ou mal formatadas
    console.error('Falha na inicialização do Firebase Admin. Verifique suas variáveis de ambiente.', error);
  }
}

// Exporta as instâncias do admin, que serão nulas se a inicialização falhar
export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminStorage = admin.apps.length ? admin.storage() : null;
