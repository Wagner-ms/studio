'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatDate, getExpirationStatus } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Eye, Tag, XCircle } from 'lucide-react';
import type { ExpirationStatus } from '@/lib/utils';

const statusStyles: Record<ExpirationStatus, {
  icon: React.ElementType,
  badgeVariant: 'destructive' | 'warning' | 'default',
  cardClass: string,
  text: string
}> = {
  expired: {
    icon: XCircle,
    badgeVariant: 'destructive',
    cardClass: 'border-destructive/50 hover:border-destructive',
    text: 'Expired'
  },
  expiringSoon: {
    icon: AlertTriangle,
    badgeVariant: 'warning',
    cardClass: 'border-warning/50 hover:border-warning',
    text: 'Expiring Soon'
  },
  safe: {
    icon: CheckCircle2,
    badgeVariant: 'default',
    cardClass: 'border-transparent hover:border-primary/50',
    text: 'Safe'
  },
};

export function ProductCard({ product }: { product: Product }) {
  const expirationDate = product.validade.toDate();
  const status = getExpirationStatus(expirationDate);
  const { icon: Icon, badgeVariant, cardClass, text } = statusStyles[status];

  return (
    <Card className={cn('transition-all', cardClass)}>
      <CardHeader>
        <CardTitle className="font-headline line-clamp-2">{product.nome}</CardTitle>
        <CardDescription className="flex items-center gap-2 pt-1">
          <Tag className="w-4 h-4" /> Lot: {product.lote}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Badge variant={badgeVariant} className="w-fit">
          <Icon className="mr-2 h-4 w-4" />
          {text}
        </Badge>
        <p className="text-sm text-muted-foreground">
          Expires on: <span className="font-medium text-foreground">{formatDate(expirationDate)}</span>
        </p>
      </CardContent>
      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Eye className="mr-2" /> View Label
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{product.nome}</DialogTitle>
            </DialogHeader>
            <div className="relative w-full aspect-video mt-4 rounded-md overflow-hidden">
               <Image
                src={product.fotoEtiqueta}
                alt={`Label for ${product.nome}`}
                layout="fill"
                objectFit="contain"
                data-ai-hint="product label"
              />
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-4 w-1/2 mt-3" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
