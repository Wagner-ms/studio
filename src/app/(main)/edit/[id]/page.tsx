
'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { updateProductAction } from '@/lib/actions';
import { Camera, Check, ChevronsUpDown, Loader2, PlusCircle, Save, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { extractProductDetails } from '@/ai/flows/extract-product-details';
import { isValid, parse, parseISO, format } from 'date-fns';
import { collection, getDocs, orderBy, query, doc, getDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Product, ProductName } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FormSchema = z.object({
  nome: z.string().min(1, 'O nome do produto é obrigatório'),
  lote: z.string().min(1, 'O número do lote é obrigatório'),
  validade: z.string().refine((val) => val && /^\d{4}-\d{2}-\d{2}$/.test(val) && isValid(parse(val, 'yyyy-MM-dd', new Date())), {
    message: 'Data inválida. Use o formato AAAA-MM-DD.',
  }),
  fotoEtiquetaFile: z.instanceof(File).optional(),
  fotoEtiquetaUrl: z.string().url().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof FormSchema>;

async function getProductNames(): Promise<ProductName[]> {
    const productNamesRef = collection(db, 'nomesDeProdutos');
    const q = query(productNamesRef, orderBy('nome', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductName));
}

async function getProductById(id: string): Promise<Product | null> {
    const productRef = doc(db, 'produtos', id);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
        return { id: productSnap.id, ...productSnap.data() } as Product;
    } else {
        return null;
    }
}


export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPageLoading, setIsPageLoading] = React.useState(true);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isOcrLoading, setIsOcrLoading] = React.useState(false);
  const [productNames, setProductNames] = React.useState<ProductName[]>([]);
  const [comboboxOpen, setComboboxOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      nome: '',
      lote: '',
      validade: '',
      fotoEtiquetaUrl: '',
    },
  });
  
  React.useEffect(() => {
    if (!productId) return;
    const fetchData = async () => {
        setIsPageLoading(true);
        try {
            const [names, product] = await Promise.all([
                getProductNames(),
                getProductById(productId)
            ]);
            
            setProductNames(names);

            if (product) {
                form.reset({
                    nome: product.nome,
                    lote: product.lote,
                    validade: format(product.validade.toDate(), 'yyyy-MM-dd'),
                    fotoEtiquetaUrl: product.fotoEtiqueta || '',
                });
                setInputValue(product.nome);
                if(product.fotoEtiqueta){
                    setImagePreview(product.fotoEtiqueta);
                }
            } else {
                setServerError("Produto não encontrado.");
                toast({
                    variant: 'destructive',
                    title: 'Erro',
                    description: 'O produto que você está tentando editar não foi encontrado.',
                });
            }
        } catch (error) {
             setServerError("Falha ao carregar os dados do produto.");
        } finally {
            setIsPageLoading(false);
        }
    };
    fetchData();
  }, [productId]);


  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('fotoEtiquetaFile', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOcr = async () => {
    const imageFile = form.getValues('fotoEtiquetaFile');
    if (!imageFile || !(imageFile instanceof File)) {
      toast({
        variant: 'destructive',
        title: 'Nenhuma nova imagem selecionada',
        description: 'Por favor, capture uma nova foto da etiqueta para usar a IA.',
      });
      return;
    }

    setIsOcrLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = async (e) => {
        const photoDataUri = e.target?.result as string;
        if (photoDataUri) {
          const result = await extractProductDetails({ photoDataUri });
          
          if (result.productName) {
            const trimmedName = result.productName.trim();
            form.setValue('nome', trimmedName, { shouldValidate: true });
            setInputValue(trimmedName);
          }
          if (result.lotNumber) {
            form.setValue('lote', result.lotNumber.trim(), { shouldValidate: true });
          }

          if (result.expirationDate) {
            const parsedDate = parseISO(result.expirationDate);
            if (isValid(parsedDate)) {
               form.setValue('validade', result.expirationDate, { shouldValidate: true });
            } else {
              form.setValue('validade', '', { shouldValidate: true });
               toast({
                  variant: 'destructive',
                  title: 'Data de Validade Inválida',
                  description: 'A IA não conseguiu extrair uma data válida. Por favor, insira manualmente.',
               });
            }
          }

          toast({
            title: 'Detalhes extraídos!',
            description: 'Os detalhes do produto foram preenchidos a partir da nova imagem.',
          });
        }
      };
    } catch (error) {
      console.error('Erro de OCR:', error);
      toast({
        variant: 'destructive',
        title: 'Falha no OCR',
        description: 'Não foi possível extrair os detalhes da imagem. Por favor, preencha manualmente.',
      });
    } finally {
      setIsOcrLoading(false);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
        let fotoEtiquetaUrl = data.fotoEtiquetaUrl || '';
        const imageFile = data.fotoEtiquetaFile;

        if (imageFile && imageFile.size > 0) {
          const storageRef = ref(storage, `product-labels/${Date.now()}-${imageFile.name}`);
          const uploadResult = await uploadBytes(storageRef, imageFile);
          fotoEtiquetaUrl = await getDownloadURL(uploadResult.ref);
        }
        
        await updateProductAction({
            id: productId,
            nome: data.nome,
            lote: data.lote,
            validade: data.validade,
            fotoEtiquetaUrl,
        });

        toast({
          title: 'Produto atualizado!',
          description: `${data.nome} foi salvo com sucesso.`,
        });
        
        router.push('/dashboard');

    } catch (error) {
        console.error("Erro ao submeter formulário:", error);
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado. Tente novamente.';
        setServerError(errorMessage);
        toast({
            variant: 'destructive',
            title: 'Erro ao Salvar Produto',
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const filteredProductNames = productNames.filter(p => p.nome.toLowerCase().includes(inputValue.toLowerCase()));
  const isNewProduct = inputValue && !productNames.some(p => p.nome.toLowerCase() === inputValue.toLowerCase());

  const selectedProductName = form.watch('nome');

  if (isPageLoading) {
      return (
         <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="w-full aspect-video rounded-lg" />
                    </div>
                     <Skeleton className="h-10 w-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
      )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Editar Produto</CardTitle>
          <CardDescription>
            Altere os detalhes do produto e salve as modificações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {serverError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fotoEtiqueta">Foto da Etiqueta (Opcional)</Label>
              <Input
                id="fotoEtiqueta"
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
              <div
                className="w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground hover:border-primary transition-colors cursor-pointer"
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <Image src={imagePreview} alt="Pré-visualização da etiqueta do produto" width={400} height={225} className="object-contain h-full w-full" data-ai-hint="product label"/>
                ) : (
                  <div className="text-center">
                    <Camera className="mx-auto h-12 w-12" />
                    <p>Toque para capturar uma nova foto</p>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleOcr}
              disabled={!imagePreview || isOcrLoading || isSubmitting || !form.formState.dirtyFields.fotoEtiquetaFile}
            >
              {isOcrLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Extrair Detalhes da Nova Imagem
            </Button>

            <div className="space-y-2">
              <Label>Nome do Produto</Label>
               <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between font-normal"
                    disabled={isSubmitting}
                  >
                    {selectedProductName || "Selecione ou crie um novo"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Busque ou crie um novo produto..."
                      value={inputValue}
                      onValueChange={setInputValue}
                     />
                    <CommandList>
                      <CommandEmpty>
                        {isNewProduct ? ' ' : 'Nenhum produto encontrado.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredProductNames.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={p.nome}
                            onSelect={(currentValue) => {
                              const finalValue = productNames.find(p => p.nome.toLowerCase() === currentValue)?.nome || currentValue;
                              form.setValue("nome", finalValue, { shouldValidate: true });
                              setInputValue(finalValue);
                              setComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedProductName?.toLowerCase() === p.nome.toLowerCase() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {p.nome}
                          </CommandItem>
                        ))}
                        {isNewProduct && (
                           <CommandItem
                              value={inputValue}
                              onSelect={(currentValue) => {
                                 const finalValue = currentValue.trim();
                                 form.setValue("nome", finalValue, { shouldValidate: true });
                                 setInputValue(finalValue);
                                 setComboboxOpen(false);
                              }}
                           >
                              <PlusCircle className="mr-2 h-4 w-4"/>
                              Criar "{inputValue}"
                           </CommandItem>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {form.formState.errors.nome && <p className="text-sm font-medium text-destructive">{form.formState.errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lote">Número do Lote</Label>
              <Input id="lote" {...form.register('lote')} placeholder="Ex: L12345" disabled={isSubmitting}/>
              {form.formState.errors.lote && <p className="text-sm font-medium text-destructive">{form.formState.errors.lote.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="validade">Data de Validade</Label>
              <Input id="validade" type="date" {...form.register('validade')} disabled={isSubmitting}/>
              {form.formState.errors.validade && <p className="text-sm font-medium text-destructive">{form.formState.errors.validade.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !form.formState.isDirty}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
