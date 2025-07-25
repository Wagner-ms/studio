'use server';

import * as admin from 'firebase-admin';

// Garante que a inicialização do app admin só aconteça uma vez
if (!admin.apps.length) {
  // Carrega as variáveis de ambiente. O Next.js deve fazer isso automaticamente no servidor.
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // A chave privada precisa ter as novas linhas restauradas
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  try {
    // Verifica se todas as credenciais necessárias estão presentes
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } else {
      // Log de erro se as credenciais estiverem incompletas
      console.error('Credenciais do Firebase Admin não estão completas. Verifique suas variáveis de ambiente.');
    }
  } catch (error) {
    console.error('Falha na inicialização do Firebase Admin:', error);
  }
}

// Exporta as instâncias do admin, que serão nulas se a inicialização falhar
export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminStorage = admin.apps.length ? admin.storage() : null;
