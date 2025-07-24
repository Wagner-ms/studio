'use client';

import * as React from 'react';
import Link from 'next/link';
import { useProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { ProductCard, ProductCardSkeleton } from '@/components/product-card';
import { PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  const { products, loading } = useProducts();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Painel de Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe seus produtos perecíveis.
          </p>
        </div>
        <Button asChild>
          <Link href="/add"><PlusCircle /> Adicionar Novo Produto</Link>
        </Button>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-2xl font-semibold font-headline">Nenhum Produto Encontrado</h2>
          <p className="text-muted-foreground mt-2 mb-6">
            Comece adicionando seu primeiro produto.
          </p>
          <Button asChild>
            <Link href="/add"><PlusCircle /> Adicionar Produto</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
