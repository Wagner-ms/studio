
'use server';

import { z } from 'zod';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase'; // Usando a instância do cliente
import { revalidatePath } from 'next/cache';
import type { ProductName } from './types';

// Validação dos dados do produto continua a mesma
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

// Garante que o nome do produto exista na coleção de nomes
// Agora usa o SDK do cliente
async function ensureProductNameExists(productName: string) {
    const trimmedName = productName.trim();
    if (!trimmedName) return;

    const productNamesRef = collection(db, 'nomesDeProdutos');
    const q = query(productNamesRef, where('nome', '==', trimmedName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        await addDoc(collection(db, 'nomesDeProdutos'), {
            nome: trimmedName,
            criadoEm: Timestamp.now()
        });
    }
}

// Busca os nomes de produtos existentes
// Agora usa o SDK do cliente
export async function getProductNames(): Promise<ProductName[]> {
    const productNamesRef = collection(db, 'nomesDeProdutos');
    const q = query(productNamesRef, orderBy('nome', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome
    }));
}

// Adiciona um novo produto
// Modificado para ser chamado pelo cliente, mas a lógica central permanece
export async function addProductAction(productData: {
  nome: string;
  lote: string;
  validade: string;
  fotoEtiquetaUrl: string;
  categoria?: string;
}) {
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
    
    await addDoc(collection(db, 'produtos'), {
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


// Atualiza um produto existente
export async function updateProductAction(productData: {
    id: string;
    nome: string;
    lote: string;
    validade: string;
    fotoEtiquetaUrl: string;
    categoria?: string;
}) {
    const validatedFields = UpdateProductSchema.safeParse(productData);

    if (!validatedFields.success) {
        const validationErrors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(validationErrors)[0]?.[0] || 'Erro de validação desconhecido.';
        throw new Error(firstError);
    }
    
    const { id, nome, lote, validade, fotoEtiquetaUrl, categoria } = validatedFields.data;
    
    try {
        await ensureProductNameExists(nome);
        
        const productRef = doc(db, 'produtos', id);
        
        const [year, month, day] = validade.split('-').map(Number);
        const validadeDate = new Date(Date.UTC(year, month - 1, day, 12));
        
        await updateDoc(productRef, {
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


// Deleta um produto
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
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    throw new Error(errorMessage);
  }
}
