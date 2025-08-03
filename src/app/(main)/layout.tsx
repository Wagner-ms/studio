import { MainNav } from "@/components/main-nav";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <MainNav />
        <main className="flex flex-1 flex-col gap-4 p-4 sm:gap-8 sm:p-6 sm:py-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
