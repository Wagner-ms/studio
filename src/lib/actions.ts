'use server';

import { z } from 'zod';
import { addDoc, collection, Timestamp, deleteDoc, doc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { revalidatePath } from 'next/cache';

const ProductSchema = z.object({
  nome: z.string().min(1, 'O nome do produto é obrigatório'),
  lote: z.string().min(1, 'O número do lote é obrigatório'),
  validade: z.string().min(1, 'A data de validade é obrigatória'),
});

async function ensureProductNameExists(productName: string) {
    const productNamesRef = collection(db, 'nomesDeProdutos');
    const q = query(productNamesRef, where('nome', '==', productName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const batch = writeBatch(db);
        const newNameRef = doc(collection(db, 'nomesDeProdutos'));
        batch.set(newNameRef, { nome: productName, criadoEm: Timestamp.now() });
        await batch.commit();
    }
}


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
    
    await ensureProductNameExists(parsed.data.nome);

    let fotoEtiqueta = '';
    const imageFile = formData.get('fotoEtiqueta') as File | null;
    
    if (imageFile && imageFile.size > 0) {
      const storageRef = ref(storage, `product-labels/${Date.now()}-${imageFile.name}`);
      const uploadResult = await uploadBytes(storageRef, imageFile);
      fotoEtiqueta = await getDownloadURL(uploadResult.ref);
    }
    
    // Create date object from YYYY-MM-DD string at UTC to avoid timezone issues.
    const validadeDate = new Date(parsed.data.validade + 'T00:00:00Z');

    const newProduct = {
      ...parsed.data,
      validade: Timestamp.fromDate(validadeDate),
      fotoEtiqueta,
      criadoEm: Timestamp.now(),
      alertado: false,
    };

    await addDoc(collection(db, 'produtos'), newProduct);

    revalidatePath('/dashboard');
    revalidatePath('/add');
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

export async function deleteProductAction(productId: string) {
    if (!productId) {
        throw new Error('ID do produto não fornecido.');
    }

    try {
        const productRef = doc(db, 'produtos', productId);
        await deleteDoc(productRef);
        revalidatePath('/dashboard');
    } catch (error) {
        console.error("Error deleting product:", error);
        throw new Error('Falha ao deletar o produto.');
    }
}
