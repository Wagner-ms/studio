
'use client';

import * as React from 'react';
import { useProducts } from '@/hooks/use-products';
import { ProductCard, ProductCardSkeleton } from '@/components/product-card';
import { getExpirationStatus } from '@/lib/utils';
import { BellRing, Check } from 'lucide-react';

export default function NotificationsPage() {
  const { products, loading } = useProducts();

  const actionableProducts = products.filter(p => {
    const status = getExpirationStatus(p.validade.toDate());
    return status === 'expired' || status === 'expiringIn2Days' || status === 'expiringSoon';
  });

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Notificações</h1>
        <p className="text-muted-foreground">
          Produtos que requerem sua atenção.
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : actionableProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed rounded-lg">
           <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
             <Check className="h-12 w-12 text-green-600 dark:text-green-400" />
           </div>
          <h2 className="text-2xl font-semibold font-headline">Tudo certo!</h2>
          <p className="text-muted-foreground mt-2">
            Nenhum produto está vencido ou com vencimento próximo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {actionableProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
