import type { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  nome: string;
  lote: string;
  validade: Timestamp;
  fotoEtiqueta: string;
  criadoEm: Timestamp;
  alertado: boolean;
  categoria?: string;
}

export interface ProductName {
  id: string;
  nome: string;
}

export interface ProductNotification {
  id:string;
  message: string;
  productId: string;
  productName: string;
  status: 'expired' | 'expiringSoon';
  createdAt: Timestamp;
  read: boolean;
}
