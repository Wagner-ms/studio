
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, Timestamp } from 'firebase/firestore'; // Import Timestamp
import { getStorage } from 'firebase/storage';

// Configuração do Firebase para o lado do cliente (navegador)
const firebaseConfig = {
  apiKey: "AIzaSyC-F57AO7k7POSp3GgJDh6XTdPw856Oi1k",
  authDomain: "valicare-xlbs5.firebaseapp.com",
  projectId: "valicare-xlbs5",
  storageBucket: "valicare-xlbs5.appspot.com",
  messagingSenderId: "440228841299",
  appId: "1:440228841299:web:ed3637d8af7fc48b3443a6"
};


// Inicializa o Firebase apenas uma vez
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage, Timestamp };
