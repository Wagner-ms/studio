
import { MainNav } from "@/components/main-nav";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col sm:flex-row bg-muted/40">
        <MainNav />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 w-full">
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
              {children}
            </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
