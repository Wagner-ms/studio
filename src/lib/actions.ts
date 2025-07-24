'use server';

import { z } from 'zod';
import { addDoc, collection, Timestamp, deleteDoc, doc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { revalidatePath } from 'next/cache';

// Schema para validação dos dados do formulário de produto
const ProductFormSchema = z.object({
  nome: z.string().trim().min(1, 'O nome do produto é obrigatório'),
  lote: z.string().trim().min(1, 'O número do lote é obrigatório'),
  validade: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: 'A data de validade deve estar no formato AAAA-MM-DD.',
  }),
});

// Função auxiliar para garantir que um nome de produto exista na coleção 'nomesDeProdutos'.
// Evita duplicação e mantém a consistência.
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

/**
 * Server Action para adicionar um novo produto.
 * Lida com upload de imagem e criação de documento no Firestore.
 * Retorna sempre um objeto serializável.
 */
export async function addProductAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const rawData = {
    nome: formData.get('nome'),
    lote: formData.get('lote'),
    validade: formData.get('validade'),
  };

  // Validação dos dados com Zod
  const validatedFields = ProductFormSchema.safeParse(rawData);

  if (!validatedFields.success) {
    // Retorna a primeira mensagem de erro se a validação falhar
    return {
      success: false,
      error: validatedFields.error.errors[0].message,
    };
  }

  try {
    const { nome, lote, validade } = validatedFields.data;

    // Garante que o nome do produto existe na coleção de nomes
    await ensureProductNameExists(nome);

    let fotoEtiquetaUrl = '';
    const imageFile = formData.get('fotoEtiqueta') as File | null;

    // Se houver um arquivo de imagem, faz o upload para o Firebase Storage
    if (imageFile && imageFile.size > 0) {
      const storageRef = ref(storage, `product-labels/${Date.now()}-${imageFile.name}`);
      const uploadResult = await uploadBytes(storageRef, imageFile);
      fotoEtiquetaUrl = await getDownloadURL(uploadResult.ref);
    }

    // Converte a string de data para um Timestamp do Firebase
    const [year, month, day] = validade.split('-').map(Number);
    const validadeDate = new Date(Date.UTC(year, month - 1, day));
    const validadeTimestamp = Timestamp.fromDate(validadeDate);

    // Cria o novo documento de produto na coleção 'produtos'
    await addDoc(collection(db, 'produtos'), {
      nome,
      lote,
      validade: validadeTimestamp,
      fotoEtiqueta: fotoEtiquetaUrl,
      criadoEm: Timestamp.now(),
      alertado: false, // Campo padrão
    });

    // Revalida os caches das páginas afetadas para refletir a mudança
    revalidatePath('/dashboard');
    revalidatePath('/add');
    revalidatePath('/notifications');
    revalidatePath('/reports');

    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    // Retorna uma mensagem de erro genérica em caso de falha no servidor
    return { success: false, error: 'Não foi possível salvar o produto. Tente novamente.' };
  }
}

/**
 * Server Action para excluir um produto.
 * Remove o documento do Firestore.
 * Retorna sempre um objeto serializável.
 */
export async function deleteProductAction(productId: string): Promise<{ success: boolean; error?: string }> {
  if (!productId) {
    return { success: false, error: 'ID do produto não fornecido.' };
  }

  try {
    const productRef = doc(db, 'produtos', productId);
    await deleteDoc(productRef);

    // Revalida os caches das páginas afetadas
    revalidatePath('/dashboard');
    revalidatePath('/notifications');
    revalidatePath('/reports');

    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return { success: false, error: 'Não foi possível excluir o produto. Tente novamente.' };
  }
}
