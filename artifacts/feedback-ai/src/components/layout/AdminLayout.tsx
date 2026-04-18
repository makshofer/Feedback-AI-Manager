import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Navbar } from "./Navbar";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navigation = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Cohort Analysis", href: "/admin/cohort", icon: BarChart },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row container mx-auto">
        <aside className="w-full md:w-64 border-r bg-card/50 hidden md:block py-6">
          <nav className="flex flex-col gap-2 px-4">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive ? "bg-secondary/80 font-medium" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>
        
        {/* Mobile Nav */}
        <div className="md:hidden border-b bg-card/50 overflow-x-auto">
          <nav className="flex p-4 gap-2 min-w-max">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2",
                      isActive ? "bg-secondary/80 font-medium" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>

        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
