import { FormEvent, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, SendHorizonal, UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export default function AssistantPage() {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Привет! Я AI-ассистент по методологии фидбека и CSAT. Спросите меня, как интерпретировать оценки, как улучшать процессы и как работать с системой.",
      createdAt: new Date().toISOString(),
    },
  ]);

  const canSubmit = useMemo(() => question.trim().length > 0 && !isLoading, [question, isLoading]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const message = question.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: message, createdAt: new Date().toISOString() }]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("feedbackai_token");
      const history = messages.slice(-8).map((item) => ({ role: item.role, content: item.content }));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, history }),
      });

      if (!response.ok) {
        throw new Error("Failed to get assistant response");
      }

      const data = (await response.json()) as { answer: string };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, createdAt: new Date().toISOString() },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Не удалось получить ответ. Попробуйте снова через несколько секунд.",
          createdAt: new Date().toISOString(),
        },
      ]);
      toast({
        variant: "destructive",
        title: "Ошибка запроса",
        description: "Проблема при обращении к AI-ассистенту.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold font-serif">AI-ассистент</h1>
            <p className="text-muted-foreground mt-1">
              Спросите про интерпретацию CSAT, методологию сбора обратной связи и работу с платформой.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs uppercase tracking-wide">
            RAG enabled
          </Badge>
        </div>

        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Bot className="h-5 w-5 text-primary" />
              Чат с ассистентом
            </CardTitle>
            <CardDescription>
              Ответы формируются на основе базы примеров фидбека и рекомендаций по CSAT.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[420px] rounded-xl border bg-muted/20 p-4">
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div key={`${msg.createdAt}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border text-foreground"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                        {msg.role === "user" ? <UserRound className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                        <span>{msg.role === "user" ? "Вы" : "Ассистент"}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Ассистент формирует ответ...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder='Например: "Как интерпретировать оценку 3 по критерию Качество аналитики?"'
                className="min-h-[92px]"
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={!canSubmit} className="min-w-[180px]">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <SendHorizonal className="mr-2 h-4 w-4" />
                      Отправить вопрос
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
