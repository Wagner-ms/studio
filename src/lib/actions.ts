'use server';

import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from './firebase-admin';
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

    const productNamesRef = adminDb.collection('nomesDeProdutos');
    const q = productNamesRef.where('nome', '==', trimmedName);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
        const newNameRef = adminDb.collection('nomesDeProdutos').doc();
        await newNameRef.set({ nome: trimmedName, criadoEm: Timestamp.now() });
    }
}

export async function addProductAction(productData: {
  nome: string;
  lote: string;
  validade: string;
  fotoEtiquetaUrl: string;
}) {
  const validatedFields = ProductSchema.safeParse(productData);

  if (!validatedFields.success) {
     // Este erro não deve acontecer com a validação do lado do cliente, mas é um fallback.
     // Retornar um objeto de erro em vez de redirecionar.
     return { success: false, error: validatedFields.error.flatten().fieldErrors };
  }

  const { nome, lote, validade, fotoEtiquetaUrl } = validatedFields.data;
  
  try {
    await ensureProductNameExists(nome);
    const [year, month, day] = validade.split('-').map(Number);
    const validadeDate = new Date(Date.UTC(year, month - 1, day));
    
    await adminDb.collection('produtos').add({
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
    // Retornar um objeto de erro para o cliente.
    return { success: false, error: `Não foi possível salvar o produto: ${errorMessage}` };
  }

  // Revalidar os caches para mostrar o novo produto.
  revalidatePath('/dashboard');
  revalidatePath('/add');
  revalidatePath('/notifications');
  revalidatePath('/reports');
  
  // Redirecionar para o painel principal após o sucesso.
  redirect('/dashboard');
}

export async function deleteProductAction(productId: string) {
  if (!productId) {
    console.error('ID do produto não fornecido para exclusão.');
    return { success: false, error: 'ID do produto não fornecido.' };
  }

  try {
    const productRef = adminDb.collection('produtos').doc(productId);
    await productRef.delete();

    // Revalidar os caches após a exclusão.
    revalidatePath('/dashboard');
    revalidatePath('/notifications');
    revalidatePath('/reports');
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return { success: false, error: errorMessage };
  }
}
