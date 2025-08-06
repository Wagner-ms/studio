
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const AUTH_COOKIE_NAME = 'session';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);
  const isAuthenticated = !!sessionCookie;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname.startsWith('/login');

  // Se o usuário não estiver autenticado e tentar acessar qualquer página
  // que não seja a de login, redirecione-o para a página de login.
  if (!isAuthenticated && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se o usuário já estiver autenticado e tentar acessar a página de login,
  // redirecione-o para o painel principal.
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Permite que a requisição continue se nenhuma das condições acima for atendida.
  return NextResponse.next();
}

// Configuração do matcher para definir quais rotas o middleware deve proteger.
export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas de requisição, exceto as seguintes:
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - favicon.ico (arquivo de ícone)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
