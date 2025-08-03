'use client';

import * as React from 'react';
import { useProducts } from '@/hooks/use-products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Package, XCircle } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
  const { loading, expiredCount, expiringIn2DaysCount, expiringSoonCount, safeCount, totalCount } = useProducts();

  const chartData = [
    { name: 'OK', count: safeCount, fill: 'var(--color-safe)' },
    { name: 'Venc. 5 dias', count: expiringSoonCount, fill: 'var(--color-warning)' },
    { name: 'Venc. 2 dias', count: expiringIn2DaysCount, fill: 'var(--color-orange)' },
    { name: 'Vencido', count: expiredCount, fill: 'var(--color-destructive)' },
  ];
  
  const StatCard = ({ title, value, icon: Icon, colorClass, isLoading }: { title: string, value: number, icon: React.ElementType, colorClass: string, isLoading: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-muted-foreground ${colorClass}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Relatórios do Inventário</h1>
        <p className="text-muted-foreground">
          Uma visão geral dos status de validade de seus produtos.
        </p>
      </header>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total de Produtos" value={totalCount} icon={Package} colorClass="" isLoading={loading} />
        <StatCard title="OK" value={safeCount} icon={CheckCircle2} colorClass="text-primary" isLoading={loading} />
        <StatCard title="Venc. 5 dias" value={expiringSoonCount} icon={AlertTriangle} colorClass="text-yellow-500" isLoading={loading} />
        <StatCard title="Venc. 2 dias" value={expiringIn2DaysCount} icon={AlertTriangle} colorClass="text-orange-500" isLoading={loading} />
        <StatCard title="Vencidos" value={expiredCount} icon={XCircle} colorClass="text-red-500" isLoading={loading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Visão Geral do Status dos Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="w-full h-[300px]">
                <Skeleton className="h-full w-full" />
             </div>
          ) : (
            <div className="w-full h-[300px]" style={{
              '--color-safe': 'hsl(var(--primary))',
              '--color-warning': 'hsl(var(--warning))',
              '--color-orange': 'hsl(var(--orange))',
              '--color-destructive': 'hsl(var(--destructive))',
            } as React.CSSProperties}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    cursor={{fill: 'hsl(var(--muted))'}}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
