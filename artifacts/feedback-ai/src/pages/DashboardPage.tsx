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
        title: "Transcription failed",
        description: "Could not process audio. Please try again."
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
        title: "Analysis failed",
        description: "Could not analyze text. Please try again."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({ title: "Error", description: "Please provide feedback content." });
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
        title: "Feedback Submitted",
        description: "Your feedback has been successfully processed and saved."
      });

      // Reset
      setContent("");
      setProjectId("none");
      setAnalysisResult(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "Could not save feedback. Please try again."
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
          <h1 className="text-3xl font-bold font-serif">Capture Feedback</h1>
          <p className="text-muted-foreground mt-1">Record or type client feedback to process immediately.</p>
        </div>
        <Link href="/dashboard/history">
          <Button variant="outline">
            <History className="mr-2 h-4 w-4" />
            View History
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>New Entry</CardTitle>
              <CardDescription>Select input method and project to start</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {projects && projects.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project (Optional)</label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Select project..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Project</SelectItem>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Tabs defaultValue="text" onValueChange={(v) => setInputType(v as "text" | "voice")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="text"><FileText className="h-4 w-4 mr-2"/> Text Notes</TabsTrigger>
                  <TabsTrigger value="voice"><Mic className="h-4 w-4 mr-2"/> Voice Memo</TabsTrigger>
                </TabsList>
                
                <TabsContent value="voice" className="space-y-4">
                  <VoiceRecorder 
                    onRecordingComplete={handleVoiceComplete} 
                    isProcessing={isAnalyzing}
                  />
                  {content && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 mt-4">
                      <label className="text-sm font-medium flex justify-between">
                        <span>Transcript</span>
                        <Badge variant="outline" className="text-xs font-normal">Editable</Badge>
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
                    placeholder="Type raw notes from the meeting here..."
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
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Analyzing...</>
                        ) : (
                          <><BrainCircuit className="mr-2 h-4 w-4"/> Extract Insights</>
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
                AI Analysis
              </CardTitle>
              {analysisResult ? (
                <CardDescription>Review and adjust the extracted scores.</CardDescription>
              ) : (
                <CardDescription>Waiting for input data...</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {analysisResult?.summary && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Summary</h4>
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
                        <span className="capitalize font-medium">{key}</span>
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
                  <><Send className="mr-2 h-5 w-5"/> Save Feedback</>
                )}
              </Button>
            </CardFooter>
          </Card>

          {recentFeedbacks && recentFeedbacks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentFeedbacks.slice(0, 3).map(f => (
                    <div key={f.id} className="flex flex-col gap-1 pb-3 border-b last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate pr-4">
                          {f.projectName || "General"}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(f.createdAt), "MMM d")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {f.summary || f.content}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                          CSAT: {f.scores?.overall || '-'}
                        </Badge>
                        <Badge variant={f.status === 'processed' ? 'default' : 'secondary'} className="text-[10px] h-5 px-1.5 capitalize font-normal">
                          {f.status}
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
