import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListFeedbacks, 
  useListProjects, 
  useTranscribeFeedback, 
  useAnalyzeFeedback, 
  useCreateFeedback,
  FeedbackScores,
  getListFeedbacksQueryKey
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Check, History, Loader2, Mic, FileText, Send } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const scoreLabels: Record<string, string> = {
  overall: "Общий",
  quality: "Качество",
  timeliness: "Своевременность",
  communication: "Коммуникация",
  expertise: "Экспертиза",
};

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [content, setContent] = useState("");
  const [projectId, setProjectId] = useState<string>("none");
  const [inputType, setInputType] = useState<"text" | "voice">("text");
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{scores: FeedbackScores, summary: string} | null>(null);

  const { data: projects } = useListProjects();
  const { data: recentFeedbacks } = useListFeedbacks({ });

  const transcribeMutation = useTranscribeFeedback();
  const analyzeMutation = useAnalyzeFeedback();
  const createMutation = useCreateFeedback();

  const handleVoiceComplete = async (base64: string, mimeType: string) => {
    setIsAnalyzing(true);
    try {
      const result = await transcribeMutation.mutateAsync({ 
        data: { audioBase64: base64, mimeType } 
      });
      
      setContent(result.transcript);
      if (result.scores && result.summary) {
        setAnalysisResult({ scores: result.scores, summary: result.summary });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка транскрипции",
        description: "Не удалось обработать аудио. Попробуйте снова."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeText = async () => {
    if (!content.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeMutation.mutateAsync({ 
        data: { content } 
      });
      setAnalysisResult({ scores: result.scores, summary: result.summary });
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

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({ title: "Ошибка", description: "Пожалуйста, введите текст обратной связи." });
      return;
    }

    try {
      await createMutation.mutateAsync({
        data: {
          content,
          inputType,
          projectId: projectId !== "none" ? parseInt(projectId, 10) : undefined,
          scores: analysisResult?.scores,
          summary: analysisResult?.summary
        }
      });

      queryClient.invalidateQueries({ queryKey: getListFeedbacksQueryKey() });
      
      toast({
        title: "Обратная связь сохранена",
        description: "Ваша запись успешно обработана и сохранена."
      });

      setContent("");
      setProjectId("none");
      setAnalysisResult(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка сохранения",
        description: "Не удалось сохранить запись. Попробуйте снова."
      });
    }
  };

  const handleScoreChange = (key: keyof FeedbackScores, value: number[]) => {
    if (analysisResult && analysisResult.scores) {
      setAnalysisResult({
        ...analysisResult,
        scores: {
          ...analysisResult.scores,
          [key]: value[0]
        }
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif">Добавить обратную связь</h1>
          <p className="text-muted-foreground mt-1">Запишите или введите обратную связь от клиента для немедленной обработки.</p>
        </div>
        <Link href="/dashboard/history">
          <Button variant="outline">
            <History className="mr-2 h-4 w-4" />
            История
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Новая запись</CardTitle>
              <CardDescription>Выберите метод ввода и проект</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {projects && projects.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Проект (необязательно)</label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Выбрать проект..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Без проекта</SelectItem>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Tabs defaultValue="text" onValueChange={(v) => setInputType(v as "text" | "voice")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="text"><FileText className="h-4 w-4 mr-2"/> Текстовые заметки</TabsTrigger>
                  <TabsTrigger value="voice"><Mic className="h-4 w-4 mr-2"/> Голосовое сообщение</TabsTrigger>
                </TabsList>
                
                <TabsContent value="voice" className="space-y-4">
                  <VoiceRecorder 
                    onRecordingComplete={handleVoiceComplete} 
                    isProcessing={isAnalyzing}
                  />
                  {content && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 mt-4">
                      <label className="text-sm font-medium flex justify-between">
                        <span>Транскрипция</span>
                        <Badge variant="outline" className="text-xs font-normal">Редактируемая</Badge>
                      </label>
                      <Textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[120px] font-mono text-sm resize-none bg-muted/30"
                      />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="text" className="space-y-4">
                  <Textarea 
                    placeholder="Введите сырые заметки со встречи здесь..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[200px] resize-y"
                  />
                  {!analysisResult && (
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleAnalyzeText} 
                        disabled={!content.trim() || isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Анализ...</>
                        ) : (
                          <><BrainCircuit className="mr-2 h-4 w-4"/> Извлечь оценки</>
                        )}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={!analysisResult ? "opacity-50 pointer-events-none grayscale-[0.5] transition-all" : "border-primary/50 shadow-md transition-all"}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Анализ ИИ
              </CardTitle>
              {analysisResult ? (
                <CardDescription>Проверьте и скорректируйте извлечённые оценки.</CardDescription>
              ) : (
                <CardDescription>Ожидание данных...</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {analysisResult?.summary && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Резюме</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md italic">
                    "{analysisResult.summary}"
                  </p>
                </div>
              )}
              
              <div className="space-y-5 pt-2">
                {(['overall', 'quality', 'timeliness', 'communication', 'expertise'] as const).map(key => {
                  const val = analysisResult?.scores?.[key] || 0;
                  return (
                    <div key={key} className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">{scoreLabels[key]}</span>
                        <span className={`font-bold w-8 text-right ${val >= 8 ? 'text-green-600 dark:text-green-400' : val >= 6 ? 'text-yellow-600 dark:text-yellow-400' : val > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                          {val || '-'}
                        </span>
                      </div>
                      <Slider 
                        defaultValue={[val]} 
                        max={10} 
                        step={1}
                        disabled={!analysisResult}
                        onValueChange={(v) => handleScoreChange(key, v)}
                        className={key === 'overall' ? '[&_.relative]:bg-primary' : ''}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t pt-6">
              <Button 
                onClick={handleSubmit} 
                disabled={!analysisResult || createMutation.isPending} 
                className="w-full text-base h-12"
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                ) : (
                  <><Send className="mr-2 h-5 w-5"/> Сохранить запись</>
                )}
              </Button>
            </CardFooter>
          </Card>

          {recentFeedbacks && recentFeedbacks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Последние записи</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentFeedbacks.slice(0, 3).map(f => (
                    <div key={f.id} className="flex flex-col gap-1 pb-3 border-b last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate pr-4">
                          {f.projectName || "Общий"}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(f.createdAt), "d MMM", { locale: ru })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {f.summary || f.content}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                          CSAT: {f.scores?.overall || '-'}
                        </Badge>
                        <Badge variant={f.status === 'processed' ? 'default' : 'secondary'} className="text-[10px] h-5 px-1.5 font-normal">
                          {f.status === 'processed' ? 'обработано' : f.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
