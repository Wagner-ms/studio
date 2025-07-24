'use server';

import { z } from 'zod';
import { addDoc, collection, Timestamp, deleteDoc, doc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { revalidatePath } from 'next/cache';

const ProductFormSchema = z.object({
  nome: z.string().trim().min(1, 'O nome do produto é obrigatório'),
  lote: z.string().trim().min(1, 'O número do lote é obrigatório'),
  validade: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: 'A data de validade deve estar no formato AAAA-MM-DD.',
  }),
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


export async function addProductAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const rawData = {
      nome: formData.get('nome'),
      lote: formData.get('lote'),
      validade: formData.get('validade'),
    };

    const validatedFields = ProductFormSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0].message,
      };
    }

    const { nome, lote, validade } = validatedFields.data;

    await ensureProductNameExists(nome);

    let fotoEtiquetaUrl = '';
    const imageFile = formData.get('fotoEtiqueta') as File | null;

    if (imageFile && imageFile.size > 0) {
      const storageRef = ref(storage, `product-labels/${Date.now()}-${imageFile.name}`);
      const uploadResult = await uploadBytes(storageRef, imageFile);
      fotoEtiquetaUrl = await getDownloadURL(uploadResult.ref);
    }

    const [year, month, day] = validade.split('-').map(Number);
    const validadeDate = new Date(Date.UTC(year, month - 1, day));
    const validadeTimestamp = Timestamp.fromDate(validadeDate);

    await addDoc(collection(db, 'produtos'), {
      nome,
      lote,
      validade: validadeTimestamp,
      fotoEtiqueta: fotoEtiquetaUrl,
      criadoEm: Timestamp.now(),
      alertado: false,
    });

    revalidatePath('/dashboard');
    revalidatePath('/add');
    revalidatePath('/notifications');
    revalidatePath('/reports');

    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    return { success: false, error: 'Não foi possível salvar o produto. Tente novamente.' };
  }
}

export async function deleteProductAction(productId: string): Promise<{ success: boolean; error?: string }> {
  if (!productId) {
    return { success: false, error: 'ID do produto não fornecido.' };
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
    return { success: false, error: 'Não foi possível excluir o produto. Tente novamente.' };
  }
}
