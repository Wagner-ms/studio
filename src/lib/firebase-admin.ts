
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const serviceAccountKey = process.env.FIREBASE_PRIVATE_KEY;

const hasCredentials = 
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    serviceAccountKey;

function getAdminApp() {
    if (getApps().some(app => app.name === 'admin')) {
        return getApp('admin');
    }

    if (!hasCredentials) {
        console.warn('As credenciais do Firebase Admin estão incompletas ou ausentes. As funcionalidades do servidor que dependem do Firebase serão desativadas.');
        return null;
    }
    
    try {
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID!,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
            privateKey: serviceAccountKey!.replace(/\\n/g, '\n'),
        };

        return initializeApp({
            credential: cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        }, 'admin');
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
        return null;
    }
}

const adminApp = getAdminApp();
const adminDb = adminApp ? getFirestore(adminApp) : null;
const adminStorage = adminApp ? getStorage(adminApp) : null;

export { adminDb, adminStorage };
