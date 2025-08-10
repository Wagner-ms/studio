
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import * as dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env na raiz do projeto
// Isso é crucial para o ambiente de desenvolvimento local.
dotenv.config({ path: '.env' });

let adminDb: Firestore;
let adminStorage: Storage;

function initializeAdminApp(): void {
  // Evita reinicializações desnecessárias
  if (getApps().length > 0) {
    const app = getApps()[0];
    adminDb = getFirestore(app);
    adminStorage = getStorage(app);
    return;
  }

  const serviceAccountKey = process.env.FIREBASE_PRIVATE_KEY;

  // Verifica se as credenciais essenciais estão presentes
  const hasCredentials = 
      process.env.FIREBASE_PROJECT_ID && 
      process.env.FIREBASE_CLIENT_EMAIL && 
      serviceAccountKey;

  if (!hasCredentials) {
    console.error("Credenciais do Firebase Admin não configuradas no ambiente do servidor.");
    // Não lança erro aqui para permitir que o build passe, 
    // mas as funções que dependem dele falharão com uma mensagem clara.
    return;
  }

  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Trata a chave privada que vem da Netlify (com \n) ou do .env
      privateKey: serviceAccountKey.replace(/\\n/g, '\n'),
    };

    const app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

    adminDb = getFirestore(app);
    adminStorage = getStorage(app);

  } catch (error) {
    console.error("Falha ao inicializar o Firebase Admin App:", error);
  }
}

// Inicializa a conexão quando este módulo é carregado pela primeira vez
initializeAdminApp();

// Funções para obter a instância do DB e Storage de forma segura
export function getAdminDb(): Firestore {
  if (!adminDb) {
    // Tenta reinicializar se a primeira tentativa falhou
    initializeAdminApp();
    if (!adminDb) {
      throw new Error('A conexão com o servidor não pôde ser inicializada. Verifique as variáveis de ambiente.');
    }
  }
  return adminDb;
}

export function getAdminStorage(): Storage {
  if (!adminStorage) {
    initializeAdminApp();
    if (!adminStorage) {
       throw new Error('A conexão com o servidor não pôde ser inicializada. Verifique as variáveis de ambiente.');
    }
  }
  return adminStorage;
}
