import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, MessageSquare, Mic, Shield, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden border-b">
          <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Интеллектуальный инструмент для сбора обратной связи</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground font-serif leading-tight">
                Превращайте разговоры с руководством в <span className="text-primary italic">практические данные.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                Feedback AI преобразует произвольные заметки и голосовые сообщения со встреч с клиентами в структурированные CSAT-оценки, обеспечивая вашей команде прозрачное понимание состояния проектов.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-8 w-full max-w-md mx-auto">
                <Link href="/register" className="w-full">
                  <Button size="lg" className="w-full text-base h-14 rounded-full group">
                    Начать работу
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/login" className="w-full">
                  <Button size="lg" variant="outline" className="w-full text-base h-14 rounded-full">
                    Войти
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-24 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4">Создано для реальной работы с клиентами.</h2>
              <p className="text-lg text-muted-foreground">У вас нет времени заполнять сложные формы после напряжённой встречи. Мы устранили все трудности в процессе сбора обратной связи.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card border rounded-2xl p-8 shadow-sm hover-elevate transition-all duration-300">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Говорите свободно</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Просто нажмите запись. Наше продвинутое распознавание речи точно транскрибирует ваши мысли, даже если вы идёте между встречами.
                </p>
              </div>
              <div className="bg-card border rounded-2xl p-8 shadow-sm hover-elevate transition-all duration-300">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Оценка на основе ИИ</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Мы автоматически извлекаем настроение и преобразуем его в 5 ключевых CSAT-критериев: Качество, Своевременность, Коммуникация, Экспертиза и Общая удовлетворённость.
                </p>
              </div>
              <div className="bg-card border rounded-2xl p-8 shadow-sm hover-elevate transition-all duration-300">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Видимость для руководства</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Удобная панель управления для партнёров и администраторов, позволяющая заметить проблемные проекты до ухода клиента. Когортный анализ уже включён.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 border-y">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="md:w-1/2 space-y-8">
                <h2 className="text-3xl md:text-5xl font-bold font-serif leading-tight">
                  От неструктурированных заметок — к структурированным данным.
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Запишите или напишите</h4>
                      <p className="text-muted-foreground">Зафиксируйте детальную обратную связь от клиента сразу после встречи.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Анализ ИИ</h4>
                      <p className="text-muted-foreground">Наши модели обрабатывают текст, создают краткое резюме и автоматически выставляют оценки.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Проверьте и сохраните</h4>
                      <p className="text-muted-foreground">При необходимости скорректируйте ползунки и сохраните. Панель управления обновится мгновенно.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 w-full">
                <div className="relative rounded-2xl border bg-card p-2 shadow-2xl overflow-hidden aspect-[4/3] flex items-center justify-center">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                   <div className="relative z-10 w-3/4 bg-background border rounded-xl shadow-lg p-6 space-y-4">
                      <div className="flex items-center gap-3 mb-6">
                        <MessageSquare className="text-primary w-5 h-5" />
                        <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">Качество</span>
                          <span className="text-primary font-bold">9/10</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full w-[90%]"></div>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm mt-4">
                          <span className="font-medium">Своевременность</span>
                          <span className="text-primary font-bold">7/10</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full w-[70%]"></div>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 relative overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 bg-grid-black/[0.1]" />
          <div className="container px-4 md:px-6 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-bold font-serif mb-6">Готовы вывести свою практику на новый уровень?</h2>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
              Присоединяйтесь к ведущим консалтинговым компаниям, которые используют Feedback AI для удержания клиентов и точного измерения эффективности.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-full text-primary">
                Создать аккаунт
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-12 bg-background">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-bold text-foreground mb-4 md:mb-0">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs">
              F
            </div>
            Feedback AI
          </div>
          <p>Создано для профессионалов. Разработано с точностью.</p>
        </div>
      </footer>
    </div>
  );
}
