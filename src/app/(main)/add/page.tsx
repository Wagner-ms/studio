'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { addProductAction } from '@/lib/actions';
import { Camera, Loader2, Save, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { extractProductDetails } from '@/ai/flows/extract-product-details';

const FormSchema = z.object({
  nome: z.string().min(1, 'Product name is required'),
  lote: z.string().min(1, 'Lot number is required'),
  validade: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  fotoEtiqueta: z.any().refine((file) => file instanceof File, 'Image is required'),
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
        title: 'No Image Selected',
        description: 'Please capture a photo of the label first.',
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
          form.setValue('validade', result.expirationDate, { shouldValidate: true });
          toast({
            title: 'Details Extracted!',
            description: 'Product details have been filled from the image.',
          });
        }
      };
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        variant: 'destructive',
        title: 'OCR Failed',
        description: 'Could not extract details from the image. Please fill them manually.',
      });
    } finally {
      setIsOcrLoading(false);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await addProductAction(formData);

    if (result?.success) {
      toast({
        title: 'Product Added!',
        description: `${data.nome} has been successfully saved.`,
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result?.error?._form?.[0] || 'Something went wrong.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Add New Product</CardTitle>
          <CardDescription>
            Capture a photo of the product label to automatically fill the details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fotoEtiqueta">Product Label Photo</Label>
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
                  <Image src={imagePreview} alt="Product label preview" width={400} height={225} className="object-contain h-full w-full" data-ai-hint="product label"/>
                ) : (
                  <div className="text-center">
                    <Camera className="mx-auto h-12 w-12" />
                    <p>Tap to capture photo</p>
                  </div>
                )}
              </div>
              {form.formState.errors.fotoEtiqueta && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.fotoEtiqueta.message as string}</p>
              )}
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
              Extract Details with AI
            </Button>

            <div className="space-y-2">
              <Label htmlFor="nome">Product Name</Label>
              <Input id="nome" {...form.register('nome')} placeholder="e.g. Organic Milk" />
              {form.formState.errors.nome && <p className="text-sm font-medium text-destructive">{form.formState.errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lote">Lot Number</Label>
              <Input id="lote" {...form.register('lote')} placeholder="e.g. L12345" />
              {form.formState.errors.lote && <p className="text-sm font-medium text-destructive">{form.formState.errors.lote.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="validade">Expiration Date</Label>
              <Input id="validade" type="date" {...form.register('validade')} />
              {form.formState.errors.validade && <p className="text-sm font-medium text-destructive">{form.formState.errors.validade.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Product
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
