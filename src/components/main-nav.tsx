'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bell, LayoutDashboard, PlusCircle } from 'lucide-react';
import { ValicareLogo } from '@/components/icons';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from './ui/button';

export function MainNav() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
    { href: '/reports', label: 'Relatórios', icon: BarChart3 },
    { href: '/notifications', label: 'Notificações', icon: Bell },
  ];

  return (
    <Sidebar>
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
              <Link href={item.href} passHref>
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
           <Link href="/add">
             <PlusCircle />
             <span>Adicionar Produto</span>
           </Link>
         </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
