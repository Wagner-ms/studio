
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { PanelLeft } from 'lucide-react';
import { ValicareLogo } from '@/components/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { useIsMobile } from '@/hooks/use-mobile';


export function MainNav() {
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  
  // No header is needed on desktop as the sidebar is always visible.
  if (!isMobile) {
    return null;
  }

  return (
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 sm:hidden">
        <Button size="icon" variant="outline" onClick={toggleSidebar}>
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
        </Button>
        <div className="flex items-center gap-2">
            <ValicareLogo className="w-7 h-7 text-primary" />
            <h1 className="text-lg font-headline font-semibold">Valicare</h1>
        </div>
      </header>
  );
}
