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

  const counts = useMemo(() => {
    const statusCounts = {
      expired: 0,
      expiringIn2Days: 0,
      expiringSoon: 0,
      safe: 0,
    };

    products.forEach(p => {
      const status = getExpirationStatus(p.validade.toDate());
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    });

    return {
      expiredCount: statusCounts.expired,
      expiringIn2DaysCount: statusCounts.expiringIn2Days,
      expiringSoonCount: statusCounts.expiringSoon,
      safeCount: statusCounts.safe,
      totalCount: products.length,
    };
  }, [products]);

  return { products, loading, error, ...counts };
}
