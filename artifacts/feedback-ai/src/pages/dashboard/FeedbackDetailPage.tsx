import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetFeedback,
  useUpdateFeedback,
  useAnalyzeFeedback,
  FeedbackScores,
  getGetFeedbackQueryKey
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Loader2, ArrowLeft, Send } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const scoreLabels: Record<string, string> = {
  overall: "Общий",
  quality: "Качество",
  timeliness: "Своевременность",
  communication: "Коммуникация",
  expertise: "Экспертиза",
};

const statusLabels: Record<string, string> = {
  requested: "Запрошен",
  voice_received: "Голос получен",
  transcribed: "Расшифрован",
  auto_scored: "Оценён ИИ",
  confirmed: "Подтверждён",
};

export default function FeedbackDetailPage({ params }: { params: { id: string } }) {
  const feedbackId = parseInt(params.id, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: feedback, isLoading } = useGetFeedback(feedbackId, { 
    query: { enabled: !!feedbackId, queryKey: getGetFeedbackQueryKey(feedbackId) } 
  });
  
  const [content, setContent] = useState("");
  const [scores, setScores] = useState<FeedbackScores | undefined>();
  const [summary, setSummary] = useState<string | undefined>();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMutation = useAnalyzeFeedback();
  const updateMutation = useUpdateFeedback();

  useEffect(() => {
    if (feedback) {
      setContent(feedback.content);
      setScores(feedback.scores);
      setSummary(feedback.summary || undefined);
    }
  }, [feedback]);

  const handleAnalyzeText = async () => {
    if (!content.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeMutation.mutateAsync({ 
        data: { content } 
      });
      setScores(result.scores);
      setSummary(result.summary);
      toast({ title: "Анализ завершён" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка анализа",
        description: "Не удалось проанализировать текст. Попробуйте снова."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdate = async () => {
    if (!content.trim()) {
      toast({ title: "Ошибка", description: "Пожалуйста, введите текст обратной связи." });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: feedbackId,
        data: {
          content,
          scores,
          summary
        }
      });

      queryClient.invalidateQueries({ queryKey: getGetFeedbackQueryKey(feedbackId) });
      
      toast({
        title: "Запись обновлена",
        description: "Изменения успешно сохранены."
      });
      
      setLocation("/dashboard/history");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка сохранения",
        description: "Не удалось сохранить изменения. Попробуйте снова."
      });
    }
  };

  const handleScoreChange = (key: keyof FeedbackScores, value: number[]) => {
    if (scores) {
      setScores({
        ...scores,
        [key]: value[0]
      });
    }
  };

  const handleConfirm = async () => {
    try {
      await updateMutation.mutateAsync({
        id: feedbackId,
        data: { status: "confirmed" },
      });
      queryClient.invalidateQueries({ queryKey: getGetFeedbackQueryKey(feedbackId) });
      toast({ title: "Запись подтверждена" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка подтверждения",
        description: "Не удалось подтвердить запись.",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!feedback) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Запись не найдена</h2>
          <p className="text-muted-foreground mb-6">Запись не существует или у вас нет доступа к ней.</p>
          <Link href="/dashboard/history">
            <Button>Вернуться к истории</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard/history" className="text-muted-foreground hover:text-primary transition-colors flex items-center text-sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> Назад к истории
        </Link>
      </div>
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif">Редактировать запись</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-muted-foreground text-sm">
              Добавлено {format(new Date(feedback.createdAt), "d MMMM yyyy", { locale: ru })}
            </span>
            <Badge variant={feedback.status === "confirmed" ? "default" : "secondary"} className="font-normal text-xs">
              {statusLabels[feedback.status] ?? feedback.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Содержание</span>
                <Badge variant="outline" className="font-normal capitalize">
                  {feedback.inputType === 'voice' ? 'голос' : 'текст'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[250px] resize-y"
              />
              <div className="flex justify-end">
                <Button 
                  variant="secondary"
                  onClick={handleAnalyzeText} 
                  disabled={!content.trim() || isAnalyzing || content === feedback.content}
                >
                  {isAnalyzing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Анализ...</>
                  ) : (
                    <><BrainCircuit className="mr-2 h-4 w-4"/> Повторный анализ</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/50 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Анализ ИИ
              </CardTitle>
              <CardDescription>Проверьте и скорректируйте извлечённые оценки.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {summary && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Резюме</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md italic">
                    "{summary}"
                  </p>
                </div>
              )}
              
              <div className="space-y-5 pt-2">
                {(['overall', 'quality', 'timeliness', 'communication', 'expertise'] as const).map(key => {
                  const val = scores?.[key] || 0;
                  return (
                    <div key={key} className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">{scoreLabels[key]}</span>
                        <span className={`font-bold w-8 text-right ${val >= 8 ? 'text-green-600 dark:text-green-400' : val >= 6 ? 'text-yellow-600 dark:text-yellow-400' : val > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                          {val || '-'}
                        </span>
                      </div>
                      <Slider 
                        value={[val]} 
                        max={10} 
                        step={1}
                        disabled={!scores}
                        onValueChange={(v) => handleScoreChange(key, v)}
                        className={key === 'overall' ? '[&_.relative]:bg-primary' : ''}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t pt-6">
              <div className="grid w-full gap-3">
                <Button 
                  onClick={handleUpdate} 
                  disabled={updateMutation.isPending} 
                  className="w-full text-base h-12"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                  ) : (
                    <><Send className="mr-2 h-5 w-5"/> Сохранить изменения</>
                  )}
                </Button>
                {user?.role === "admin" && feedback.status !== "confirmed" && (
                  <Button variant="secondary" onClick={handleConfirm} disabled={updateMutation.isPending}>
                    Подтвердить вручную
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
