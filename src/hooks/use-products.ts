
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

  const { expiredCount, expiringIn3DaysCount, expiringIn7DaysCount, expiringSoonCount, safeCount, totalCount } = useMemo(() => {
    let expired = 0;
    let expiringIn3Days = 0;
    let expiringIn7Days = 0;
    let expiringSoon = 0;
    let safe = 0;

    products.forEach(p => {
      const status = getExpirationStatus(p.validade.toDate());
      switch (status) {
        case 'expired':
          expired++;
          break;
        case 'expiringIn3Days':
          expiringIn3Days++;
          break;
        case 'expiringIn7Days':
          expiringIn7Days++;
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
      expiringIn3DaysCount: expiringIn3Days,
      expiringIn7DaysCount: expiringIn7Days,
      expiringSoonCount: expiringSoon,
      safeCount: safe,
      totalCount: products.length
    };
  }, [products]);

  return { products, loading, error, expiredCount, expiringIn3DaysCount, expiringIn7DaysCount, expiringSoonCount, safeCount, totalCount };
}
