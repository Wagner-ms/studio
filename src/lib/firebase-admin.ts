
import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const serviceAccountKey = process.env.FIREBASE_PRIVATE_KEY;

// Verifica se as credenciais essenciais estão presentes.
const hasCredentials = 
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    serviceAccountKey;

let adminDb: ReturnType<typeof getFirestore> | null = null;
let adminStorage: ReturnType<typeof getStorage> | null = null;

function initializeAdminApp() {
  if (hasCredentials) {
    try {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        // A chave privada precisa ter as quebras de linha restauradas.
        // O JSON.parse garante que a string seja interpretada corretamente,
        // incluindo os caracteres de nova linha (\n).
        privateKey: JSON.parse(`"${serviceAccountKey!}"`),
      };
      
      const app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      }, 'admin');
      
      adminDb = getFirestore(app);
      adminStorage = getStorage(app);
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
      // Se a inicialização falhar, mantenha os serviços como null.
      adminDb = null;
      adminStorage = null;
    }
  } else {
    console.warn('As credenciais do Firebase Admin estão incompletas ou ausentes. As funcionalidades do servidor que dependem do Firebase serão desativadas.');
  }
}


// Inicializa o app apenas uma vez.
if (getApps().filter(app => app.name === 'admin').length === 0) {
    initializeAdminApp();
} else {
    const app = getApp('admin');
    adminDb = getFirestore(app);
    adminStorage = getStorage(app);
}

export { adminDb, adminStorage };
