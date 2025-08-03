'use client';

import * as React from 'react';

// Este componente não é mais necessário no layout raiz
// e foi removido para simplificar a estrutura e corrigir bugs de layout.
// Pode ser reutilizado no futuro, se necessário.
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
