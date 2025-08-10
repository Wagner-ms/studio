
'use server';

import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from './firebase-admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ProductName } from './types';

const ProductSchema = z.object({
  nome: z.string().trim().min(1, 'O nome do produto é obrigatório'),
  lote: z.string().trim().min(1, 'O número do lote é obrigatório'),
  validade: z.string().refine((val) => val && /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: 'A data de validade deve estar no formato AAAA-MM-DD.',
  }),
  fotoEtiquetaUrl: z.string().url().optional().or(z.literal('')),
  categoria: z.string().optional(),
});

const UpdateProductSchema = ProductSchema.extend({
  id: z.string().min(1, { message: 'Product ID is required' }),
});


async function ensureProductNameExists(productName: string) {
    const adminDb = getAdminDb();
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

export async function getProductNames(): Promise<ProductName[]> {
    const adminDb = getAdminDb();
    const productNamesRef = adminDb.collection('nomesDeProdutos');
    const q = productNamesRef.orderBy('nome', 'asc');
    const querySnapshot = await q.get();
    
    // CORREÇÃO: Retorna apenas os campos necessários (id e nome) para evitar erros de serialização.
    return querySnapshot.docs.map(doc => {
        return { 
            id: doc.id, 
            nome: doc.data().nome 
        } as ProductName;
    });
}

export async function addProductAction(productData: {
  nome: string;
  lote: string;
  validade: string;
  fotoEtiquetaUrl: string;
  categoria?: string;
}) {
  const adminDb = getAdminDb();
  
  const validatedFields = ProductSchema.safeParse(productData);

  if (!validatedFields.success) {
     const validationErrors = validatedFields.error.flatten().fieldErrors;
     const firstError = Object.values(validationErrors)[0]?.[0] || 'Erro de validação desconhecido.';
     throw new Error(firstError);
  }
  
  const { nome, lote, validade, fotoEtiquetaUrl, categoria } = validatedFields.data;
  
  try {
    await ensureProductNameExists(nome);
    
    const [year, month, day] = validade.split('-').map(Number);
    const validadeDate = new Date(Date.UTC(year, month - 1, day, 12));
    
    await adminDb.collection('produtos').add({
      nome,
      lote,
      validade: Timestamp.fromDate(validadeDate),
      fotoEtiqueta: fotoEtiquetaUrl,
      criadoEm: Timestamp.now(),
      alertado: false,
      categoria,
    });
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    throw new Error(errorMessage);
  }

  revalidatePath('/dashboard');
  revalidatePath('/notifications');
  revalidatePath('/reports');
}

export async function updateProductAction(productData: {
    id: string;
    nome: string;
    lote: string;
    validade: string;
    fotoEtiquetaUrl: string;
    categoria?: string;
}) {
    const adminDb = getAdminDb();
    
    const validatedFields = UpdateProductSchema.safeParse(productData);

    if (!validatedFields.success) {
        const validationErrors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(validationErrors)[0]?.[0] || 'Erro de validação desconhecido.';
        throw new Error(firstError);
    }
    
    const { id, nome, lote, validade, fotoEtiquetaUrl, categoria } = validatedFields.data;
    
    try {
        await ensureProductNameExists(nome);
        
        const productRef = adminDb.collection('produtos').doc(id);
        
        const [year, month, day] = validade.split('-').map(Number);
        const validadeDate = new Date(Date.UTC(year, month - 1, day, 12));
        
        await productRef.update({
            nome,
            lote,
            validade: Timestamp.fromDate(validadeDate),
            fotoEtiqueta: fotoEtiquetaUrl,
            categoria,
        });

    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
        throw new Error(errorMessage);
    }

    revalidatePath('/dashboard');
    revalidatePath('/notifications');
    revalidatePath('/reports');
    revalidatePath(`/edit/${id}`);
}


export async function deleteProductAction(productId: string) {
  const adminDb = getAdminDb();

  if (!productId) {
    throw new Error('ID do produto não fornecido.');
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
    throw new Error(errorMessage);
  }
}
