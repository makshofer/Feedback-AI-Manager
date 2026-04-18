import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Имя должно содержать не менее 2 символов"),
  username: z.string().min(3, "Имя пользователя должно содержать не менее 3 символов").regex(/^[a-zA-Z0-9_]+$/, "Имя пользователя может содержать только буквы, цифры и подчёркивания"),
  password: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
});

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    registerMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          login(data.user, data.token);
          toast({
            title: "Аккаунт создан",
            description: "Добро пожаловать в Feedback AI.",
          });
          setLocation("/dashboard");
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Ошибка регистрации",
            description: error.message || "Что-то пошло не так. Попробуйте снова.",
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex bg-primary text-primary-foreground flex-col justify-center p-12 border-r relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-black/[0.1]" />
        <div className="relative z-10 max-w-lg mx-auto space-y-6">
          <h2 className="text-4xl font-serif font-bold leading-tight">
            Структурируйте свою интуицию.
          </h2>
          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            Создайте аккаунт, чтобы начать системно собирать обратную связь от клиентов. Превратите субъективные ощущения в твёрдые данные.
          </p>
          <div className="pt-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">✓</div>
              <span>Анализ тональности на основе ИИ</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">✓</div>
              <span>Транскрипция голоса в текст</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">✓</div>
              <span>Автоматическое выставление CSAT-оценок</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="space-y-2 text-center md:text-left">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary mr-2">F</div>
              Feedback AI
            </Link>
            <h1 className="text-3xl font-serif font-bold tracking-tight">Создать аккаунт</h1>
            <p className="text-muted-foreground">Введите данные, чтобы начать работу.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Полное имя</FormLabel>
                    <FormControl>
                      <Input placeholder="Иван Иванов" {...field} className="h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя пользователя</FormLabel>
                    <FormControl>
                      <Input placeholder="ivanov" {...field} className="h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-12 text-base rounded-lg group mt-6" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Создать аккаунт
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm text-muted-foreground pt-4">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
