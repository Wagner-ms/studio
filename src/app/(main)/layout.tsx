
import { MainNav } from "@/components/main-nav";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40 sm:flex-row">
        <MainNav />
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
