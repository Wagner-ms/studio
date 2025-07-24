'use client';

import * as React from 'react';
import { useProducts } from '@/hooks/use-products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Package, XCircle } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
  const { loading, expiredCount, expiringSoonCount, safeCount, totalCount } = useProducts();

  const chartData = [
    { name: 'Safe', count: safeCount, fill: 'var(--color-safe)' },
    { name: 'Expiring Soon', count: expiringSoonCount, fill: 'var(--color-warning)' },
    { name: 'Expired', count: expiredCount, fill: 'var(--color-expired)' },
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
        <h1 className="text-3xl font-bold font-headline tracking-tight">Inventory Reports</h1>
        <p className="text-muted-foreground">
          An overview of your product expiration statuses.
        </p>
      </header>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={totalCount} icon={Package} colorClass="" isLoading={loading} />
        <StatCard title="Safe" value={safeCount} icon={CheckCircle2} colorClass="text-green-500" isLoading={loading} />
        <StatCard title="Expiring Soon" value={expiringSoonCount} icon={AlertTriangle} colorClass="text-yellow-500" isLoading={loading} />
        <StatCard title="Expired" value={expiredCount} icon={XCircle} colorClass="text-red-500" isLoading={loading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Products Status Overview</CardTitle>
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
              '--color-expired': 'hsl(var(--destructive))',
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
