import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onRecordingComplete: (base64: string, mimeType: string) => void;
  isProcessing?: boolean;
}

export function VoiceRecorder({ onRecordingComplete, isProcessing }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);
      
      mediaRecorder.current = recorder;
      audioChunks.current = [];

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
          // Extract just the base64 part
          const base64 = base64data.split(',')[1];
          onRecordingComplete(base64, recorder.mimeType);
        };
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
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
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use voice recording.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-card/50 transition-colors data-[state=recording]:border-destructive data-[state=recording]:bg-destructive/5" data-state={isRecording ? 'recording' : 'idle'}>
      {isProcessing ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium animate-pulse">Transcribing and analyzing...</p>
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
                <span className="text-2xl font-mono tracking-wider text-destructive font-semibold">
                  {formatTime(recordingTime)}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm font-medium">Click to start recording</span>
            )}
          </div>

          {isRecording ? (
            <Button 
              size="lg" 
              variant="destructive" 
              className="h-16 w-16 rounded-full p-0 flex items-center justify-center shadow-lg hover-elevate"
              onClick={stopRecording}
            >
              <Square className="h-6 w-6 fill-current" />
            </Button>
          ) : (
            <Button 
              size="lg" 
              className="h-16 w-16 rounded-full p-0 flex items-center justify-center shadow-lg hover-elevate bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={startRecording}
            >
              <Mic className="h-7 w-7" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
