import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onRecordingComplete: (base64: string, mimeType: string, localTranscript?: string) => void;
  isProcessing?: boolean;
}

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

export function VoiceRecorder({ onRecordingComplete, isProcessing }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const localTranscriptRef = useRef<string>("");
  const speechRecognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const { toast } = useToast();

  const startSpeechRecognition = () => {
    const RecognitionCtor = (window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;

    if (!RecognitionCtor) {
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = "ru-RU";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const next = Array.from(event.results).map((result) => result[0]?.transcript ?? "").join(" ").trim();
      localTranscriptRef.current = next;
    };
    recognition.onerror = (event) => {
      console.warn("Speech recognition error", event.error);
    };
    recognition.start();
    speechRecognitionRef.current = recognition;
  };

  const stopSpeechRecognition = () => {
    speechRecognitionRef.current?.stop();
    speechRecognitionRef.current = null;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: "audio/webm" };
      const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);

      mediaRecorder.current = recorder;
      audioChunks.current = [];
      localTranscriptRef.current = "";
      startSpeechRecognition();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: recorder.mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const base64 = base64data.split(",")[1];
          onRecordingComplete(base64, recorder.mimeType, localTranscriptRef.current);
        };

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        variant: "destructive",
        title: "Нет доступа к микрофону",
        description: "Пожалуйста, разрешите доступ к микрофону для записи голоса.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      stopSpeechRecognition();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-card/50 transition-colors data-[state=recording]:border-destructive data-[state=recording]:bg-destructive/5" data-state={isRecording ? "recording" : "idle"}>
      {isProcessing ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium animate-pulse">Транскрипция и анализ...</p>
        </div>
      ) : (
        <>
          <div className="mb-6 h-12 flex items-center justify-center">
            {isRecording ? (
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                </span>
                <span className="text-2xl font-mono tracking-wider text-destructive font-semibold">{formatTime(recordingTime)}</span>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm font-medium">Нажмите, чтобы начать запись</span>
            )}
          </div>

          {isRecording ? (
            <Button size="lg" variant="destructive" className="h-16 w-16 rounded-full p-0 flex items-center justify-center shadow-lg hover-elevate" onClick={stopRecording}>
              <Square className="h-6 w-6 fill-current" />
            </Button>
          ) : (
            <Button size="lg" className="h-16 w-16 rounded-full p-0 flex items-center justify-center shadow-lg hover-elevate bg-primary text-primary-foreground hover:bg-primary/90" onClick={startRecording}>
              <Mic className="h-7 w-7" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
