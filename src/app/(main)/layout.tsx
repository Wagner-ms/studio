
import { MainNav } from "@/components/main-nav";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
        <MainNav />
        <main className="flex-1 p-4 sm:p-6 bg-muted/40">
          {children}
        </main>
    </SidebarProvider>
  );
}
