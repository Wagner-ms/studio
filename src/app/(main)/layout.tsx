
'use client';

import { MainNav } from "@/components/main-nav";
import { Sidebar, useSidebar } from "@/components/ui/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import * as React from 'react';
import Link from "next/link";
import { BarChart3, Bell, LayoutDashboard, LogOut, PlusCircle } from "lucide-react";
import { ValicareLogo } from "@/components/icons";
import { SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth.actions";

function LogoutForm() {
    return (
        <form action={logoutAction}>
            <SidebarMenuButton type="submit" className="w-full justify-start">
                <LogOut />
                <span>Sair</span>
            </SidebarMenuButton>
        </form>
    );
}

function SidebarNavigation() {
    const { setOpenMobile } = useSidebar();

    const menuItems = [
      { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
      { href: '/reports', label: 'Relatórios', icon: BarChart3 },
      { href: '/notifications', label: 'Notificações', icon: Bell },
    ];
    
    const handleLinkClick = () => {
        setOpenMobile(false);
    }

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <ValicareLogo className="w-8 h-8 text-primary" />
                    <h1 className="text-xl font-headline font-semibold">Valicare</h1>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {menuItems.map((item) => (
                         <SidebarMenuItem key={item.href}>
                            <Link href={item.href} passHref onClick={handleLinkClick}>
                                <SidebarMenuButton as="a" href={item.href} tooltip={item.label}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                 <Button asChild className="w-full">
                    <Link href="/add" onClick={handleLinkClick}>
                        <PlusCircle />
                        <span>Adicionar Produto</span>
                    </Link>
                </Button>
                <LogoutForm />
            </SidebarFooter>
        </Sidebar>
    );
}


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
        <div className="flex min-h-screen">
          <SidebarNavigation />
          <main className="flex-1 bg-muted/40">
              <MainNav />
              {children}
          </main>
        </div>
    </SidebarProvider>
  );
}
