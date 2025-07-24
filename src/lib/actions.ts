'use server';

import { z } from 'zod';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { revalidatePath } from 'next/cache';

const ProductSchema = z.object({
  nome: z.string().min(1, 'O nome do produto é obrigatório'),
  lote: z.string().min(1, 'O número do lote é obrigatório'),
  validade: z.string().min(1, 'A data de validade é obrigatória'),
});

export async function addProductAction(formData: FormData) {
  try {
    const parsed = ProductSchema.safeParse({
      nome: formData.get('nome'),
      lote: formData.get('lote'),
      validade: formData.get('validade'),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().fieldErrors };
    }

    const imageFile = formData.get('fotoEtiqueta') as File;
    if (!imageFile || imageFile.size === 0) {
      return { success: false, error: { fotoEtiqueta: ['A imagem é obrigatória.'] } };
    }

    // Upload image to Firebase Storage
    const storageRef = ref(storage, `product-labels/${Date.now()}-${imageFile.name}`);
    const uploadResult = await uploadBytes(storageRef, imageFile);
    const fotoEtiqueta = await getDownloadURL(uploadResult.ref);

    // Prepare data for Firestore
    const newProduct = {
      ...parsed.data,
      validade: Timestamp.fromDate(new Date(parsed.data.validade)),
      fotoEtiqueta,
      criadoEm: Timestamp.now(),
      alertado: false,
    };

    // Add document to Firestore
    await addDoc(collection(db, 'produtos'), newProduct);

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error adding product:', error);
    let errorMessage = 'Ocorreu um erro inesperado.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { success: false, error: { _form: [errorMessage] } };
  }
}
