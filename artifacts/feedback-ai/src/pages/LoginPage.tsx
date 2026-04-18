import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
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
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          login(data.user, data.token);
          toast({
            title: "Welcome back",
            description: `Signed in successfully as ${data.user.name}.`,
          });
          setLocation(data.user.role === "admin" ? "/admin" : "/dashboard");
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: error.message || "Invalid credentials. Please try again.",
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="space-y-2 text-center md:text-left">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary mr-2">F</div>
              Feedback AI
            </Link>
            <h1 className="text-3xl font-serif font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to your account to continue.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} className="h-12" />
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-12 text-base rounded-lg group" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm text-muted-foreground pt-4">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline underline-offset-4">
              Register
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden md:flex bg-muted flex-col justify-center p-12 border-l relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
        <div className="relative z-10 max-w-lg mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground mx-auto shadow-xl">
             <span className="font-serif text-3xl font-bold">"</span>
          </div>
          <h2 className="text-2xl font-serif italic text-foreground leading-relaxed">
            This tool completely changed how we track client health. No more guessing, just clear signals.
          </h2>
          <p className="font-medium text-muted-foreground">— Senior Partner, Strategy Consulting</p>
        </div>
      </div>
    </div>
  );
}
