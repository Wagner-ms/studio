'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import { getExpirationStatus } from '@/lib/utils';
import type { ExpirationStatus } from '@/lib/utils';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'produtos'), orderBy('validade', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const productsData: Product[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          productsData.push({
            id: doc.id,
            ...data,
          } as Product);
        });
        setProducts(productsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching products:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getProductCountByStatus = (status: ExpirationStatus) => {
    return products.filter(p => getExpirationStatus(p.validade.toDate()) === status).length;
  }
  
  const expiredCount = getProductCountByStatus('expired');
  const expiringSoonCount = getProductCountByStatus('expiringSoon');
  const safeCount = getProductCountByStatus('safe');
  const totalCount = products.length;

  return { products, loading, error, expiredCount, expiringSoonCount, safeCount, totalCount };
}
