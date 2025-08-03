
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
import { AlertTriangle, CheckCircle2, Eye, FileQuestion, Loader2, Pencil, Tag, Trash2, XCircle } from 'lucide-react';
import type { ExpirationStatus } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteProductAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import * as React from 'react';
import Link from 'next/link';

const statusStyles: Record<ExpirationStatus, {
  icon: React.ElementType,
  badgeVariant: 'destructive' | 'warning' | 'default' | 'orange',
  cardClass: string,
  text: string
}> = {
  expired: {
    icon: XCircle,
    badgeVariant: 'orange',
    cardClass: 'border-orange-500/50 hover:border-orange-500',
    text: 'Vencido'
  },
  expiringSoon: {
    icon: AlertTriangle,
    badgeVariant: 'warning',
    cardClass: 'border-warning/50 hover:border-warning',
    text: 'Venc. Próximo'
  },
  safe: {
    icon: CheckCircle2,
    badgeVariant: 'default',
    cardClass: 'border-transparent hover:border-primary/50',
    text: 'OK'
  },
};

export function ProductCard({ product }: { product: Product }) {
  const expirationDate = product.validade.toDate();
  const status = getExpirationStatus(expirationDate);
  const { icon: Icon, badgeVariant, cardClass, text } = statusStyles[status];
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);


  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProductAction(product.id);
      toast({
        title: 'Produto excluído!',
        description: `${product.nome} foi removido com sucesso.`,
      });
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
       toast({
          variant: 'destructive',
          title: 'Erro ao excluir',
          description: errorMessage,
        });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={cn('transition-all', cardClass)}>
      <CardHeader>
        <CardTitle className="font-headline line-clamp-2">{product.nome}</CardTitle>
        <CardDescription className="flex items-center gap-2 pt-1">
          <Tag className="w-4 h-4" /> Lote: {product.lote}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Badge variant={badgeVariant} className="w-fit">
          <Icon className="mr-2 h-4 w-4" />
          {text}
        </Badge>
        <p className="text-sm text-muted-foreground">
          Vence em: <span className="font-medium text-foreground">{formatDate(expirationDate)}</span>
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" disabled={!product.fotoEtiqueta}>
              <Eye className="mr-2" /> Ver Etiqueta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{product.nome}</DialogTitle>
            </DialogHeader>
            <div className="relative w-full aspect-video mt-4 rounded-md overflow-hidden bg-muted flex items-center justify-center">
               {product.fotoEtiqueta ? (
                 <Image
                    src={product.fotoEtiqueta}
                    alt={`Etiqueta para ${product.nome}`}
                    fill
                    objectFit="contain"
                    data-ai-hint="product label"
                  />
               ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileQuestion className="w-12 h-12" />
                  <span>Nenhuma imagem disponível</span>
                </div>
               )}
            </div>
          </DialogContent>
        </Dialog>
        
        <Button variant="outline" size="icon" asChild>
          <Link href={`/edit/${product.id}`}>
            <Pencil />
            <span className="sr-only">Editar Produto</span>
          </Link>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto
                "{product.nome}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
      <CardFooter className="flex justify-between gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </CardFooter>
    </Card>
  );
}
