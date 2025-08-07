
'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAME } from '@/middleware';

const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const AUTH_USER = 'admin';
const AUTH_PASS = 'pas2025';

export async function loginAction(credentials: z.infer<typeof LoginSchema>) {
  const validatedCredentials = LoginSchema.safeParse(credentials);

  if (!validatedCredentials.success) {
    throw new Error('Dados de login inválidos.');
  }

  const { username, password } = validatedCredentials.data;

  if (username === AUTH_USER && password === AUTH_PASS) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    cookies().set(AUTH_COOKIE_NAME, 'authenticated', { expires, httpOnly: true });
  } else {
    throw new Error('Usuário ou senha inválidos.');
  }

  // O redirecionamento é tratado pelo lado do cliente na página de login,
  // após esta ação ser concluída com sucesso.
}


export async function logoutAction() {
    cookies().delete(AUTH_COOKIE_NAME);
    redirect('/login');
}
