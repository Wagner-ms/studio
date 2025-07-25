
'use server';

import { z } from 'zod';
import { addDoc, collection, Timestamp, deleteDoc, doc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const ProductSchema = z.object({
  nome: z.string().trim().min(1, 'O nome do produto é obrigatório'),
  lote: z.string().trim().min(1, 'O número do lote é obrigatório'),
  validade: z.string().refine((val) => val && /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: 'A data de validade deve estar no formato AAAA-MM-DD.',
  }),
  fotoEtiquetaUrl: z.string().url().optional().or(z.literal('')),
});


async function ensureProductNameExists(productName: string) {
    const trimmedName = productName.trim();
    if (!trimmedName) return;

    const productNamesRef = collection(db, 'nomesDeProdutos');
    const q = query(productNamesRef, where('nome', '==', trimmedName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const newNameRef = doc(collection(db, 'nomesDeProdutos'));
        await setDoc(newNameRef, { nome: trimmedName, criadoEm: Timestamp.now() });
    }
}

export async function addProductAction(productData: {
  nome: string;
  lote: string;
  validade: string;
  fotoEtiquetaUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const validatedFields = ProductSchema.safeParse(productData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.errors.map(e => e.message).join(', '),
    };
  }
  
  const { nome, lote, validade, fotoEtiquetaUrl } = validatedFields.data;
  
  try {
    await ensureProductNameExists(nome);

    const [year, month, day] = validade.split('-').map(Number);
    const validadeDate = new Date(Date.UTC(year, month - 1, day));
    
    await addDoc(collection(db, 'produtos'), {
      nome,
      lote,
      validade: Timestamp.fromDate(validadeDate),
      fotoEtiqueta: fotoEtiquetaUrl,
      criadoEm: Timestamp.now(),
      alertado: false,
    });
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return { success: false, error: `Não foi possível salvar o produto. Detalhe: ${errorMessage}` };
  }

  revalidatePath('/dashboard');
  revalidatePath('/add');
  revalidatePath('/notifications');
  revalidatePath('/reports');
  
  redirect('/dashboard');
}

export async function deleteProductAction(productId: string): Promise<{ success: boolean; error?: string }> {
  if (!productId) {
    return { success: false, error: 'ID do produto não fornecido.' };
  }

  try {
    const productRef = doc(db, 'produtos', productId);
    await deleteDoc(productRef);
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return { success: false, error: `Não foi possível excluir o produto. Detalhe: ${errorMessage}` };
  }

  revalidatePath('/dashboard');
  revalidatePath('/notifications');
  revalidatePath('/reports');

  return { success: true };
}
