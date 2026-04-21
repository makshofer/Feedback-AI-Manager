import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, Bot, BrainCircuit, Database, MessageCircle, Mic, Workflow } from "lucide-react";

const steps = [
  {
    icon: MessageCircle,
    title: "Telegram Trigger (n8n)",
    description: "Webhook получает текст или voice от @Managers_Feedback_AI_bot и отправляет payload в API.",
  },
  {
    icon: Mic,
    title: "Speech-to-Text",
    description: "Голосовые сообщения транскрибируются через LLM-модель в endpoint /api/feedbacks/transcribe.",
  },
  {
    icon: BrainCircuit,
    title: "RAG + LLM Scoring",
    description: "API добавляет исторический контекст менеджера (RAG) и рассчитывает CSAT-оценки.",
  },
  {
    icon: Database,
    title: "PostgreSQL Persist",
    description: "Результаты сохраняются в БД (feedbacks, users, activity_log), формируя аналитику.",
  },
  {
    icon: Bot,
    title: "Confirmation Back to TG",
    description: "n8n отправляет подтверждение пользователю и обновляет статус карточки фидбека.",
  },
];

export default function WorkflowPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-bold font-serif">Vibe-coding Workflow</h1>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Продукт реализован как orchestration-процесс: основной сценарий собирается в n8n, а веб-платформа,
            Telegram-бот и LLM-сервисы подключаются как шаги workflow.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Статус соответствия требованию «вайб-кодинг»</CardTitle>
            <CardDescription>
              Ниже визуализирован production-flow для проверки комиссией. Доступ открыт только в админ-разделе.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>n8n orchestration</Badge>
              <Badge variant="secondary">LLM + RAG</Badge>
              <Badge variant="secondary">Telegram integration</Badge>
              <Badge variant="secondary">PostgreSQL</Badge>
              <Badge variant="secondary">Analytics funnel</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {steps.map((step, idx) => (
            <div key={step.title} className="space-y-3">
              <Card>
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{idx + 1}. {step.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
              {idx < steps.length - 1 && (
                <div className="flex justify-center text-muted-foreground">
                  <ArrowDown className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Файл workflow для n8n</CardTitle>
            <CardDescription>
              Экспорт готового сценария сохранен в репозитории: <code>docs/workflows/n8n-feedback-pipeline.json</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </AdminLayout>
  );
}
