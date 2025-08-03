
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { ProductCard, ProductCardSkeleton } from '@/components/product-card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownAZ, CalendarClock, Clock, PlusCircle, Search } from 'lucide-react';
import { getExpirationStatus } from '@/lib/utils';
import type { ExpirationStatus } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product } from '@/lib/types';


export default function DashboardPage() {
  const { products, loading, safeCount, expiringSoonCount, expiringIn2DaysCount, expiredCount } = useProducts();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<ExpirationStatus | 'all'>('all');
  const [sortOrder, setSortOrder] = React.useState<keyof Product | 'nome'>('validade');


  const sortedAndFilteredProducts = React.useMemo(() => {
    return products
      .filter((product) => {
        // Filter by search query (product name)
        return product.nome.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .filter((product) => {
        // Filter by status
        if (statusFilter === 'all') {
          return true;
        }
        return getExpirationStatus(product.validade.toDate()) === statusFilter;
      })
      .sort((a, b) => {
        if (sortOrder === 'nome') {
          return a.nome.localeCompare(b.nome);
        }
        if (sortOrder === 'validade') {
          return a.validade.toMillis() - b.validade.toMillis(); // Ascending
        }
        if (sortOrder === 'criadoEm') {
          return b.criadoEm.toMillis() - a.criadoEm.toMillis(); // Descending for newest first
        }
        return 0;
      });
  }, [products, searchQuery, statusFilter, sortOrder]);
  
  const statusCounts = {
    all: products.length,
    safe: safeCount,
    expiringSoon: expiringSoonCount,
    expiringIn2Days: expiringIn2DaysCount,
    expired: expiredCount,
  };


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
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do produto..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
         <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
            <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="validade">
                    <div className='flex items-center gap-2'>
                        <CalendarClock className="h-4 w-4" />
                        <span>Por Validade</span>
                    </div>
                </SelectItem>
                <SelectItem value="nome">
                    <div className='flex items-center gap-2'>
                        <ArrowDownAZ className="h-4 w-4" />
                        <span>Por Nome (A-Z)</span>
                    </div>
                </SelectItem>
                <SelectItem value="criadoEm">
                     <div className='flex items-center gap-2'>
                        <Clock className="h-4 w-4" />
                        <span>Mais Recentes</span>
                    </div>
                </SelectItem>
            </SelectContent>
        </Select>
      </div>

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="all">Todos ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="safe" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">OK ({statusCounts.safe})</TabsTrigger>
          <TabsTrigger value="expiringSoon" className="data-[state=active]:bg-warning/20 data-[state=active]:text-warning-foreground">5 dias ({statusCounts.expiringSoon})</TabsTrigger>
          <TabsTrigger value="expiringIn2Days" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">Até 2 dias ({statusCounts.expiringIn2Days})</TabsTrigger>
          <TabsTrigger value="expired" className="data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive-foreground">Vencido ({statusCounts.expired})</TabsTrigger>
        </TabsList>
      </Tabs>


      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : sortedAndFilteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-2xl font-semibold font-headline">Nenhum Produto Encontrado</h2>
          <p className="text-muted-foreground mt-2 mb-6">
            {searchQuery || statusFilter !== 'all' 
             ? "Tente ajustar sua busca ou filtros."
             : "Comece adicionando seu primeiro produto."
            }
          </p>
           {!(searchQuery || statusFilter !== 'all') && (
              <Button asChild>
                <Link href="/add"><PlusCircle /> Adicionar Produto</Link>
              </Button>
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedAndFilteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
