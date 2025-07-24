'use server';

import { z } from 'zod';
import { addDoc, collection, Timestamp, deleteDoc, doc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { revalidatePath } from 'next/cache';
import { parse, isValid } from 'date-fns';

const ProductSchema = z.object({
  nome: z.string().trim().min(1, 'O nome do produto é obrigatório'),
  lote: z.string().trim().min(1, 'O número do lote é obrigatório'),
  validade: z.string().refine((val) => val && isValid(parse(val, 'yyyy-MM-dd', new Date())), {
    message: 'Data de validade inválida.',
  }),
});

async function ensureProductNameExists(productName: string) {
    const trimmedName = productName.trim();
    if (!trimmedName) return;

    const productNamesRef = collection(db, 'nomesDeProdutos');
    const q = query(productNamesRef, where('nome', '==', trimmedName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const batch = writeBatch(db);
        const newNameRef = doc(collection(db, 'nomesDeProdutos'));
        batch.set(newNameRef, { nome: trimmedName, criadoEm: Timestamp.now() });
        await batch.commit();
    }
}


export async function addProductAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const rawData = {
    nome: formData.get('nome'),
    lote: formData.get('lote'),
    validade: formData.get('validade'),
  };

  const parsed = ProductSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || 'Verifique os campos do formulário.';
    return { success: false, error: firstError };
  }

  try {
    const { nome, lote, validade } = parsed.data;
    
    await ensureProductNameExists(nome);

    let fotoEtiqueta = '';
    const imageFile = formData.get('fotoEtiqueta') as File | null;
    
    if (imageFile && imageFile.size > 0) {
      const storageRef = ref(storage, `product-labels/${Date.now()}-${imageFile.name}`);
      const uploadResult = await uploadBytes(storageRef, imageFile);
      fotoEtiqueta = await getDownloadURL(uploadResult.ref);
    }
    
    const validadeDate = parse(validade, 'yyyy-MM-dd', new Date());

    const newProduct = {
      nome,
      lote,
      validade: Timestamp.fromDate(validadeDate),
      fotoEtiqueta,
      criadoEm: Timestamp.now(),
      alertado: false,
    };

    await addDoc(collection(db, 'produtos'), newProduct);

    revalidatePath('/dashboard');
    revalidatePath('/add');
    revalidatePath('/notifications');
    revalidatePath('/reports');
    return { success: true };
  } catch (error) {
    console.error('Error adding product:', error);
    let errorMessage = 'Ocorreu um erro inesperado ao salvar o produto.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
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
        revalidatePath('/notifications');
        revalidatePath('/reports');
    } catch (error) {
        console.error("Error deleting product:", error);
        throw new Error('Falha ao deletar o produto.');
    }
}
