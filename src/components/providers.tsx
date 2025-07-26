'use client';

import * as React from 'react';

// O SidebarProvider foi movido para o layout principal (/app/(main)/layout.tsx)
// para encapsular a navegação e o conteúdo principal corretamente.
// Este arquivo pode ser removido ou usado para outros providers globais no futuro.

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
