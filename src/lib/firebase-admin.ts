
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

// As variáveis de ambiente são carregadas automaticamente pelo Next.js.
// Manter esta estrutura garante que a inicialização ocorra apenas uma vez.

let adminDb: Firestore;
let adminStorage: Storage;

function initializeAdminApp() {
  const serviceAccountKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!getApps().length) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !serviceAccountKey) {
      throw new Error('As credenciais do Firebase Admin não estão configuradas no ambiente do servidor.');
    }

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Garante que as quebras de linha na chave privada sejam interpretadas corretamente.
      privateKey: serviceAccountKey.replace(/\\n/g, '\n'),
    };

    const app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

    adminDb = getFirestore(app);
    adminStorage = getStorage(app);
  } else {
    // Se o app já foi inicializado, apenas obtenha as instâncias.
    const app = getApps()[0];
    adminDb = getFirestore(app);
    adminStorage = getStorage(app);
  }
}

// Inicializa o app na primeira vez que o módulo é importado.
try {
  initializeAdminApp();
} catch (error) {
  console.error("Firebase Admin Initialization Error:", error);
  // Este erro será lançado se as variáveis de ambiente não estiverem presentes.
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    // Esta é uma salvaguarda, mas a inicialização acima deve prevenir isso.
    try {
       initializeAdminApp();
    } catch(e) {
         console.error("Falha ao tentar reinicializar o Firebase Admin DB:", e);
         throw new Error('A conexão com o servidor não pôde ser inicializada. Verifique as variáveis de ambiente.');
    }
  }
  return adminDb;
}

export function getAdminStorage(): Storage {
  if (!adminStorage) {
    try {
       initializeAdminApp();
    } catch(e) {
        console.error("Falha ao tentar reinicializar o Firebase Admin Storage:", e);
        throw new Error('A conexão com o servidor não pôde ser inicializada. Verifique as variáveis de ambiente.');
    }
  }
  return adminStorage;
}
