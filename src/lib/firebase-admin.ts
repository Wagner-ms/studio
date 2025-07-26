
import * as admin from 'firebase-admin';

// Garante que a inicialização do app admin só aconteça uma vez
if (!admin.apps.length) {
  try {
    // Tenta construir as credenciais a partir das variáveis de ambiente
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    
    // Verifica se todas as chaves da conta de serviço estão presentes
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
        console.error('Credenciais do Firebase Admin incompletas. Verifique suas variáveis de ambiente (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).');
    }
  } catch (error) {
    console.error('Falha na inicialização do Firebase Admin:', error);
  }
}

// Exporta as instâncias do admin, que serão nulas se a inicialização falhar
export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminStorage = admin.apps.length ? admin.storage() : null;
