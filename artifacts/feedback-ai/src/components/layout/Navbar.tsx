import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, LayoutDashboard, Bot, MessageCircleMore } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const TELEGRAM_BOT_URL = "https://t.me/Managers_Feedback_AI_bot";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4">
        <Link href="/">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary cursor-pointer">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">F</div>
            Feedback AI
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          {user?.role !== "admin" && (
            <a href={TELEGRAM_BOT_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                <MessageCircleMore className="h-4 w-4 mr-2" />
                Telegram-бот
              </Button>
            </a>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <Badge variant={user.role === "admin" ? "default" : "secondary"} className="uppercase text-[10px] tracking-wide">
                Роль: {user.role === "admin" ? "Администратор" : "Менеджер"}
              </Badge>

              <Link href={user.role === "admin" ? "/admin" : "/dashboard"}>
                <Button variant="ghost" className="text-sm font-medium">Панель управления</Button>
              </Link>
              <Link href="/assistant">
                <Button variant="ghost" className="text-sm font-medium">
                  AI-ассистент
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground border">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">{user.username}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href={user.role === "admin" ? "/admin" : "/dashboard"}>
                    <DropdownMenuItem className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Панель управления
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/assistant">
                    <DropdownMenuItem className="cursor-pointer">
                      <Bot className="mr-2 h-4 w-4" />
                      AI-ассистент
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground" onSelect={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost">Войти</Button>
              </Link>
              <Link href="/register">
                <Button>Начать</Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
