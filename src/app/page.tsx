import { redirect } from 'next/navigation'

export default function Home() {
  // Redireciona da raiz para a página de login por padrão.
  // O middleware cuidará do redirecionamento para o dashboard se o usuário já estiver logado.
  redirect('/login');
}
