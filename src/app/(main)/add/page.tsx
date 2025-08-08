
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { addProductAction, getProductNames } from '@/lib/actions';
import { Camera, Check, ChevronsUpDown, Loader2, PlusCircle, Save, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { extractProductDetails } from '@/ai/flows/extract-product-details';
import { isValid, parse, parseISO } from 'date-fns';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { ProductName } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FormSchema = z.object({
  nome: z.string().min(1, 'O nome do produto é obrigatório'),
  lote: z.string().min(1, 'O número do lote é obrigatório'),
  validade: z.string().refine((val) => val && /^\d{4}-\d{2}-\d{2}$/.test(val) && isValid(parse(val, 'yyyy-MM-dd', new Date())), {
    message: 'Data inválida. Use o formato AAAA-MM-DD.',
  }),
  fotoEtiquetaFile: z.instanceof(File).optional(),
  categoria: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

const productCategories = ['Cam.Bebidas', 'cam.laticinios', 'cam.congelados', 'cam.sorvete', 'Cam.Fiambra'];

export default function AddProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isOcrLoading, setIsOcrLoading] = React.useState(false);
  const [productNames, setProductNames] = React.useState<ProductName[]>([]);
  const [comboboxOpen, setComboboxOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [serverError, setServerError] = React.useState<string | null>(searchParams.get('error'));

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      nome: '',
      lote: '',
      validade: '',
      categoria: '',
    },
  });

  React.useEffect(() => {
    const fetchNames = async () => {
        try {
            const names = await getProductNames();
            setProductNames(names);
        } catch (error) {
            console.error("Failed to fetch product names:", error);
            toast({
                variant: "destructive",
                title: "Erro ao carregar nomes",
                description: "Não foi possível carregar a lista de produtos existentes.",
            });
        }
    };
    fetchNames();
  }, []);


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
        title: 'Nenhuma imagem selecionada',
        description: 'Por favor, capture uma foto da etiqueta primeiro.',
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
          if (result.category && productCategories.includes(result.category)) {
            form.setValue('categoria', result.category, { shouldValidate: true });
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
            description: 'Os detalhes do produto foram preenchidos a partir da imagem.',
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
        let fotoEtiquetaUrl = '';
        const imageFile = data.fotoEtiquetaFile;

        if (imageFile && imageFile.size > 0) {
          const storageRef = ref(storage, `product-labels/${Date.now()}-${imageFile.name}`);
          const uploadResult = await uploadBytes(storageRef, imageFile);
          fotoEtiquetaUrl = await getDownloadURL(uploadResult.ref);
        }

        const productData = {
          nome: data.nome,
          lote: data.lote,
          validade: data.validade,
          fotoEtiquetaUrl: fotoEtiquetaUrl,
          categoria: data.categoria,
        };
        
        await addProductAction(productData);

        toast({
          title: 'Produto adicionado!',
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

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Adicionar Novo Produto</CardTitle>
          <CardDescription>
            Capture uma foto da etiqueta para preencher os detalhes ou preencha manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {serverError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro no Servidor</AlertTitle>
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
                    <p>Toque para capturar a foto</p>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleOcr}
              disabled={!imagePreview || isOcrLoading || isSubmitting}
            >
              {isOcrLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Extrair Detalhes com IA
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
                <Label htmlFor="categoria">Categoria</Label>
                <Select onValueChange={(value) => form.setValue('categoria', value)} defaultValue={form.getValues('categoria')} disabled={isSubmitting}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        {productCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Produto
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

    