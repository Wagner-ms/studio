
'use client';

import * as React from 'react';
import { useProducts } from '@/hooks/use-products';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Download, Package, PieChart as PieChartIcon, XCircle } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Pie, Cell, Legend, PieChart } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDate, getExpirationStatus, getExpirationStatusText } from '@/lib/utils';
import type { Product } from '@/lib/types';
import type { ExpirationStatus } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const STATUS_OPTIONS: { id: ExpirationStatus; label: string }[] = [
    { id: 'safe', label: 'OK' },
    { id: 'expiringSoon', label: 'Venc. 5 dias' },
    { id: 'expiringIn2Days', label: 'Venc. até 2 dias' },
    { id: 'expired', label: 'Vencido' },
];
const productCategories = ['Cam.Bebidas', 'cam.laticinios', 'cam.congelados', 'cam.sorvete', 'Cam.Fiambra'];
const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];


export default function ReportsPage() {
  const { products, loading, expiredCount, expiringIn2DaysCount, expiringSoonCount, safeCount, totalCount, categoryCounts } = useProducts();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedStatuses, setSelectedStatuses] = React.useState<Record<ExpirationStatus, boolean>>({
    safe: true,
    expiringSoon: true,
    expiringIn2Days: true,
    expired: true,
  });
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  const statusChartData = [
    { name: 'OK', count: safeCount, fill: 'var(--color-safe)' },
    { name: 'Venc. 5 dias', count: expiringSoonCount, fill: 'var(--color-warning)' },
    { name: 'Venc. até 2 dias', count: expiringIn2DaysCount, fill: 'var(--color-orange)' },
    { name: 'Vencido', count: expiredCount, fill: 'var(--color-destructive)' },
  ];

  const categoryChartData = React.useMemo(() => {
    return Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [categoryCounts]);
  
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

  const generateCSV = (data: Product[]) => {
    const headers = ['Nome do Produto', 'Lote', 'Data de Validade', 'Status', 'Categoria'];
    const rows = data.map(product => [
      `"${product.nome.replace(/"/g, '""')}"`, // Handle quotes in product name
      product.lote,
      formatDate(product.validade.toDate()),
      getExpirationStatusText(getExpirationStatus(product.validade.toDate())),
      product.categoria || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  };

  const handleDownload = () => {
    const activeStatuses = Object.entries(selectedStatuses)
        .filter(([, isSelected]) => isSelected)
        .map(([status]) => status as ExpirationStatus);
    
    const filteredProducts = products
      .filter(p => activeStatuses.includes(getExpirationStatus(p.validade.toDate())))
      .filter(p => selectedCategory === 'all' || p.categoria === selectedCategory);

    if (filteredProducts.length === 0) {
        alert("Nenhum produto encontrado para os filtros selecionados.");
        return;
    }

    const csvData = generateCSV(filteredProducts);
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const fileName = `relatorio_produtos_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDialogOpen(false);
  };
  
  const handleSelectAll = (checked: boolean) => {
    setSelectedStatuses({
        safe: checked,
        expiringSoon: checked,
        expiringIn2Days: checked,
        expired: checked,
    });
  };

  const allSelected = Object.values(selectedStatuses).every(Boolean);


  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Relatórios do Inventário</h1>
            <p className="text-muted-foreground">
            Uma visão geral dos status de validade e categorias de seus produtos.
            </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                 <Button disabled={loading || products.length === 0}>
                    <Download className="mr-2 h-4 w-4"/> Baixar Relatório CSV
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Personalizar Relatório</DialogTitle>
                    <DialogDescription>
                        Selecione os filtros para os produtos que você deseja incluir no seu relatório CSV.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div>
                        <Label className='text-base font-semibold'>Filtrar por Categoria</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Categorias</SelectItem>
                                {productCategories.map(category => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className='text-base font-semibold'>Filtrar por Status</Label>
                        <div className="flex items-center space-x-2 mt-4">
                            <Checkbox 
                               id="select-all" 
                               checked={allSelected}
                               onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                               aria-label="Selecionar todos"
                            />
                            <Label htmlFor="select-all" className="font-bold">Selecionar Todos</Label>
                        </div>
                        <hr className='my-2'/>
                        <div className='grid grid-cols-2 gap-2'>
                        {STATUS_OPTIONS.map(option => (
                            <div key={option.id} className="flex items-center space-x-2">
                                <Checkbox 
                                   id={option.id} 
                                   checked={selectedStatuses[option.id]}
                                   onCheckedChange={(checked) => setSelectedStatuses(prev => ({...prev, [option.id]: Boolean(checked)}))}
                                />
                                <Label htmlFor={option.id}>{option.label}</Label>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleDownload}>Baixar CSV</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </header>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total de Produtos" value={totalCount} icon={Package} colorClass="" isLoading={loading} />
        <StatCard title="OK" value={safeCount} icon={CheckCircle2} colorClass="text-primary" isLoading={loading} />
        <StatCard title="Venc. 5 dias" value={expiringSoonCount} icon={AlertTriangle} colorClass="text-yellow-500" isLoading={loading} />
        <StatCard title="Venc. até 2 dias" value={expiringIn2DaysCount} icon={AlertTriangle} colorClass="text-orange-500" isLoading={loading} />
        <StatCard title="Vencidos" value={expiredCount} icon={XCircle} colorClass="text-red-500" isLoading={loading} />
      </div>

       <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                <CardTitle className="font-headline">Visão Geral do Status</CardTitle>
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
                        <BarChart data={statusChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
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

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Distribuição por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                     {loading ? (
                        <div className="w-full h-[300px]">
                            <Skeleton className="h-full w-full" />
                        </div>
                    ) : categoryChartData.length === 0 ? (
                         <div className="flex flex-col items-center justify-center text-center h-[300px] text-muted-foreground">
                            <PieChartIcon className="w-12 h-12 mb-4" />
                            <p>Nenhum produto com categoria definida ainda.</p>
                        </div>
                    ) : (
                        <div className="w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Tooltip
                                    cursor={{ fill: "hsl(var(--muted))" }}
                                    contentStyle={{
                                        background: "hsl(var(--background))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "var(--radius)",
                                    }}
                                />
                                <Pie
                                    data={categoryChartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    innerRadius={60}
                                    paddingAngle={5}
                                    labelLine={false}
                                    label={({
                                        cx,
                                        cy,
                                        midAngle,
                                        innerRadius,
                                        outerRadius,
                                        percent,
                                        index,
                                    }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                        return (
                                        <text
                                            x={x}
                                            y={y}
                                            fill="hsl(var(--card-foreground))"
                                            textAnchor={x > cx ? 'start' : 'end'}
                                            dominantBaseline="central"
                                            className='text-xs font-medium'
                                        >
                                            {`${(percent * 100).toFixed(0)}%`}
                                        </text>
                                        );
                                    }}
                                >
                                    {categoryChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend iconSize={12} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
      </div>

    </div>
  );

    