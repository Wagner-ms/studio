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
    if (!adminDb) throw new Error("Firebase Admin not initialized");
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
  if (!adminDb) {
    const errorMessage = "Falha na conexão com o servidor. Verifique as credenciais do Firebase.";
    console.error(errorMessage);
    // Redireciona com uma mensagem de erro clara
    redirect(`/add?error=${encodeURIComponent(errorMessage)}`);
  }
  
  const validatedFields = ProductSchema.safeParse(productData);

  if (!validatedFields.success) {
     const validationErrors = validatedFields.error.flatten().fieldErrors;
     const firstError = Object.values(validationErrors)[0]?.[0] || 'Erro de validação desconhecido.';
     redirect(`/add?error=${encodeURIComponent(firstError)}`);
  }
  
  const { nome, lote, validade, fotoEtiquetaUrl } = validatedFields.data;
  
  try {
    await ensureProductNameExists(nome);
    const [year, month, day] = validade.split('-').map(Number);
    // A data UTC é importante para evitar problemas de fuso horário
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
    redirect(`/add?error=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath('/dashboard');
  revalidatePath('/add');
  revalidatePath('/notifications');
  revalidatePath('/reports');
  
  redirect('/dashboard');
}

export async function deleteProductAction(productId: string) {
  if (!adminDb) {
    console.error("Firebase Admin SDK não foi inicializado corretamente ao tentar excluir.");
    return { success: false, error: 'Falha na conexão com o servidor.' };
  }

  if (!productId) {
    return { success: false, error: 'ID do produto não fornecido.' };
  }

  try {
    const productRef = adminDb.collection('produtos').doc(productId);
    await productRef.delete();

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
