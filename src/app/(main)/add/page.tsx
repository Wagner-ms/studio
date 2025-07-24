'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { addProductAction } from '@/lib/actions';
import { Camera, Loader2, Save, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { extractProductDetails } from '@/ai/flows/extract-product-details';
import { isValid, parseISO } from 'date-fns';

const FormSchema = z.object({
  nome: z.string().min(1, 'O nome do produto é obrigatório'),
  lote: z.string().min(1, 'O número do lote é obrigatório'),
  validade: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Formato de data inválido',
  }),
  fotoEtiqueta: z.any().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

export default function AddProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isOcrLoading, setIsOcrLoading] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      nome: '',
      lote: '',
      validade: '',
    },
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('fotoEtiqueta', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOcr = async () => {
    const imageFile = form.getValues('fotoEtiqueta');
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
          form.setValue('nome', result.productName, { shouldValidate: true });
          form.setValue('lote', result.lotNumber, { shouldValidate: true });

          // Validate date before setting
          const parsedDate = parseISO(result.expirationDate);
          if (isValid(parsedDate)) {
             form.setValue('validade', result.expirationDate, { shouldValidate: true });
          } else {
            form.setValue('validade', '', { shouldValidate: true }); // Clear if invalid
             toast({
                variant: 'destructive',
                title: 'Data de Validade Inválida',
                description: 'A IA não conseguiu extrair uma data válida. Por favor, insira manualmente.',
             });
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
    const formData = new FormData();
    // Apenas anexa a foto se ela existir
    if (data.fotoEtiqueta instanceof File) {
      formData.append('fotoEtiqueta', data.fotoEtiqueta);
    }
    formData.append('nome', data.nome);
    formData.append('lote', data.lote);
    formData.append('validade', data.validade);

    const result = await addProductAction(formData);

    if (result?.success) {
      toast({
        title: 'Produto adicionado!',
        description: `${data.nome} foi salvo com sucesso.`,
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: result?.error?._form?.[0] || 'Algo deu errado.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Adicionar Novo Produto</CardTitle>
          <CardDescription>
            Capture uma foto da etiqueta do produto para preencher os detalhes automaticamente ou preencha manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              />
              <div
                className="w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground hover:border-primary transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
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
              disabled={!imagePreview || isOcrLoading}
            >
              {isOcrLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Extrair Detalhes com IA
            </Button>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Produto</Label>
              <Input id="nome" {...form.register('nome')} placeholder="Ex: Leite Integral" />
              {form.formState.errors.nome && <p className="text-sm font-medium text-destructive">{form.formState.errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lote">Número do Lote</Label>
              <Input id="lote" {...form.register('lote')} placeholder="Ex: L12345" />
              {form.formState.errors.lote && <p className="text-sm font-medium text-destructive">{form.formState.errors.lote.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="validade">Data de Validade</Label>
              <Input id="validade" type="date" {...form.register('validade')} />
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
