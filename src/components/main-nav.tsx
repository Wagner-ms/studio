
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bell, LayoutDashboard, PanelLeft, PlusCircle } from 'lucide-react';
import { ValicareLogo } from '@/components/icons';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

export function MainNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  const menuItems = [
    { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
    { href: '/reports', label: 'Relatórios', icon: BarChart3 },
    { href: '/notifications', label: 'Notificações', icon: Bell },
  ];
  
  const handleLinkClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  }

  const NavContent = () => (
    <>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <ValicareLogo className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-headline font-semibold">Valicare</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref onClick={handleLinkClick}>
                <SidebarMenuButton
                  as="a"
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button asChild className="w-full">
          <Link href="/add" onClick={handleLinkClick}>
            <PlusCircle />
            <span>Adicionar Produto</span>
          </Link>
        </Button>
      </SidebarFooter>
    </>
  );

  if (isMobile) {
    return (
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4 sm:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-full max-w-xs flex-col p-0">
             <NavContent />
          </SheetContent>
        </Sheet>
         <div className="flex items-center gap-2">
           <ValicareLogo className="w-7 h-7 text-primary" />
           <h1 className="text-lg font-headline font-semibold">Valicare</h1>
         </div>
      </header>
    );
  }

  return (
    <Sidebar className="hidden border-r sm:flex sm:flex-col">
       <NavContent />
    </Sidebar>
  );
}
