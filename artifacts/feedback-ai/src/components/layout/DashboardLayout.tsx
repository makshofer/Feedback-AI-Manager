import { Navbar } from "@/components/layout/Navbar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <main className="container mx-auto py-8 px-4 md:px-6">
        {children}
      </main>
    </div>
  );
}
