
'use client';

import { useState, useEffect, useMemo } from 'react';
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

  const { expiredCount, expiringIn2DaysCount, expiringSoonCount, safeCount, totalCount } = useMemo(() => {
    let expired = 0;
    let expiringIn2Days = 0;
    let expiringSoon = 0;
    let safe = 0;

    products.forEach(p => {
      const status = getExpirationStatus(p.validade.toDate());
      switch (status) {
        case 'expired':
          expired++;
          break;
        case 'expiringIn2Days':
          expiringIn2Days++;
          break;
        case 'expiringSoon':
          expiringSoon++;
          break;
        case 'safe':
          safe++;
          break;
      }
    });

    return {
      expiredCount: expired,
      expiringIn2DaysCount: expiringIn2Days,
      expiringSoonCount: expiringSoon,
      safeCount: safe,
      totalCount: products.length
    };
  }, [products]);

  return { products, loading, error, expiredCount, expiringIn2DaysCount, expiringSoonCount, safeCount, totalCount };
}
