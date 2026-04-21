import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, BrainCircuit, LineChart, MessageSquareQuote, Mic, ShieldCheck, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

const TELEGRAM_BOT_URL = "https://t.me/Managers_Feedback_AI_bot";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,140,50,0.18),transparent_46%)]" />
          <div className="container relative z-10 px-4 py-24 md:px-6 md:py-32">
            <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
              <div className="space-y-7">
                <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Feedback AI для топ-менеджмента
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                  Собирайте фидбек руководителей и переводите его в
                  <span className="text-primary"> измеримые управленческие метрики</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                  Руководители могут оставить обратную связь на сайте или через Telegram-бота. Мы распознаем голос, анализируем смысл с помощью LLM + RAG и сразу превращаем сигнал в количественные оценки по ключевым направлениям.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link href="/register"><Button size="lg" className="h-12 px-8">Запустить пилот <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                  <a href={TELEGRAM_BOT_URL} target="_blank" rel="noreferrer"><Button size="lg" variant="outline" className="h-12 px-8">Открыть Telegram-бота</Button></a>
                </div>
              </div>
              <div className="rounded-3xl border bg-card p-7 shadow-2xl shadow-primary/10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><h3 className="font-semibold text-lg">Executive Pulse (Live)</h3><span className="text-xs text-green-600">● online</span></div>
                  <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                    <p className="font-medium">ФИО: Иванов Дмитрий Сергеевич</p>
                    <p className="text-muted-foreground mt-2">"Команда выросла в скорости реакции, но проседает качество handover между департаментами..."</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[["Overall", 8], ["Communication", 9], ["Delivery", 7], ["Risk", 6]].map(([label, value]) => (
                      <div key={label as string} className="rounded-lg border p-3">
                        <p className="text-muted-foreground">{label}</p>
                        <p className="text-xl font-bold">{value}/10</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: Mic, title: "Голос → Текст", desc: "Надежная транскрибация голосовых сообщений с пост-обработкой." },
                { icon: Bot, title: "Telegram интеграция", desc: "@Managers_Feedback_AI_bot принимает текст и voice от руководителей." },
                { icon: BrainCircuit, title: "LLM + RAG", desc: "Анализирует новые сигналы с учетом исторического контекста менеджера." },
                { icon: LineChart, title: "Управленческие KPI", desc: "Преобразует свободный фидбек в числовые оценки и тренды." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border bg-card p-6 shadow-sm">
                  <item.icon className="h-6 w-6 text-primary mb-4" />
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 border-y bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="rounded-2xl border bg-card p-6 md:p-8">
              <p className="text-xs uppercase tracking-wider text-primary font-semibold">Vibe-coding ready</p>
              <h3 className="text-2xl font-bold mt-2">Оркестрация через workflow (n8n)</h3>
              <p className="text-muted-foreground mt-3 max-w-3xl">
                Решение построено не как монолитный "ручной" pipeline: процесс сбора, STT, LLM/RAG-анализа,
                записи в БД и ответа в Telegram оформлен как workflow-сценарий. Для администраторов доступна
                отдельная страница с визуализацией этого потока в разделе Admin → Workflow.
              </p>
            </div>
          </div>
        </section>


        <section className="py-20 border-y bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <MessageSquareQuote className="h-10 w-10 text-primary mx-auto" />
              <h2 className="text-3xl font-bold">Сценарий использования для руководителей</h2>
              <p className="text-muted-foreground">1) Руководитель оставляет фидбек на сайте или в Telegram, начиная с ФИО. 2) Система распознает речь и анализирует обратную связь. 3) Администраторы видят изменения метрик и автора сообщения.</p>
            </div>
          </div>
        </section>

        <section className="py-24 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6 text-center">
            <ShieldCheck className="h-10 w-10 mx-auto mb-4" />
            <h2 className="text-4xl font-bold">Готово для корпоративного контура</h2>
            <p className="text-primary-foreground/90 max-w-2xl mx-auto mt-3 mb-8">Роли администратор/менеджер, трассируемость авторства, история фидбека и автоматические подтверждения в боте уже поддерживаются.</p>
            <Link href="/login"><Button size="lg" variant="secondary" className="text-primary">Войти в платформу</Button></Link>
          </div>
        </section>
      </main>
    </div>
  );
}
