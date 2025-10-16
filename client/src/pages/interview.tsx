import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SendHorizontal, Loader2, X, Mic, MicOff, Square, Volume2, VolumeX } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import type { InterviewSession, InterviewTurn } from "@shared/schema";

export default function Interview() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [answer, setAnswer] = useState("");
  const answerRef = useRef(answer);
  
  // Update ref when answer changes
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  // Speech-to-text functionality
  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
    interimTranscript,
    error: speechError,
    resetTranscript,
    countdown
  } = useSpeechToText({
    onResult: (text) => {
      setAnswer(prev => prev + text);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Speech Recognition Error",
        description: error,
      });
    },
    onAutoSubmit: (transcript) => {
      console.log("Auto-submit triggered with transcript:", transcript);
      console.log("Current answer ref:", answerRef.current);
      console.log("Answer ref length:", answerRef.current.length);
      
      // Check if transcript has more than 1 character
      if (transcript.trim().length > 1) {
        console.log("Auto-submitting answer with transcript:", transcript);
        // Set the answer to the full transcript from speech recognition
        setAnswer(transcript);
        // Submit directly with the transcript instead of relying on state
        submitAnswerMutation.mutate(transcript);
      } else {
        console.log("Auto-submit skipped - Transcript too short (length:", transcript.trim().length, ")");
      }
    },
    autoStart: false,
    silenceTimeout: 4000
  });

  // Text-to-speech functionality
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isLoading: isTTSLoading,
    error: ttsError,
    hasUserInteracted,
    enableAudio,
  } = useTextToSpeech({
    apiKey: 'AIzaSyAdEZvuLkTF0wQ914dwFGJZAhB46sb_Ca4',
    language: 'en-US',
    voiceName: 'en-US-Neural2-F',
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Text-to-Speech Error",
        description: error,
      });
    },
  });

  const { data: session, isLoading } = useQuery<InterviewSession & {
    currentQuestion?: { questionText: string };
    turns?: InterviewTurn[];
    totalQuestions?: number;
  }>({
    queryKey: ["/api/sessions", sessionId],
    queryFn: async () => {
      const data = await apiRequest("GET", `/api/sessions/${sessionId}`);
      return data;
    },
    enabled: !!sessionId,
    refetchInterval: (data) => {
      if (data?.status === "completed") {
        return false;
      }
      return 1000;
    },
  });

  // Auto-read question when it changes
  useEffect(() => {
    if (session?.currentQuestion?.questionText) {
      // Always try to read the question automatically
      // The speak function will handle user interaction requirements
      speak(session.currentQuestion.questionText);
    }
    
    // Cleanup: stop speaking when component unmounts or question changes
    return () => {
      stopSpeaking();
    };
  }, [session?.currentQuestion?.questionText]);

  const submitAnswerMutation = useMutation({
    mutationFn: async (userAnswer: string) => {
      return await apiRequest("POST", "/api/sessions/answer", {
        sessionId,
        answer: userAnswer,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId] });
      setAnswer("");
      
      if (data.completed) {
        queryClient.invalidateQueries({ queryKey: ["/api/sessions/history"] });
        setLocation(`/results/${sessionId}`);
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to submit answer",
        description: error.message || "Please try again",
      });
    },
  });

  const quitSessionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/sessions/${sessionId}/quit`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/history"] });
      toast({
        title: "Test ended",
        description: "You have successfully quit the test.",
      });
      setLocation("/tests");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to quit test",
        description: error.message || "Please try again",
      });
    },
  });

  const handleSubmit = async () => {
    await enableAudio(); // Enable audio on user interaction
    if (!answer.trim()) {
      toast({
        variant: "destructive",
        title: "Empty answer",
        description: "Please provide an answer before submitting",
      });
      return;
    }
    submitAnswerMutation.mutate(answer);
  };

  const handleStartListening = async () => {
    console.log("handleStartListening called");
    console.log("isSupported:", isSupported);
    console.log("isListening:", isListening);
    
    await enableAudio(); // Enable audio on user interaction
    
    if (!isSupported) {
      console.log("Speech recognition not supported");
      toast({
        variant: "destructive",
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please use a modern browser like Chrome or Edge.",
      });
      return;
    }
    
    console.log("Starting speech recognition...");
    startListening();
  };

  const handleStopListening = () => {
    try {
      stopListening();
    } catch (error) {
      console.error("Error stopping speech recognition:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-3xl p-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Session not found</p>
          <Button onClick={() => setLocation("/tests")} className="mt-4">
            Back to Tests
          </Button>
        </div>
      </div>
    );
  }

  const progress = session.totalQuestions
    ? ((session.currentQuestionIndex + 1) / session.totalQuestions) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Question {session.currentQuestionIndex + 1} of {session.totalQuestions}
            </span>
            <div className="flex items-center gap-4">
              <span>{Math.round(progress)}% Complete</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <X className="h-4 w-4 mr-2" />
                    Quit Test
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Quit Test?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to quit this test? Your progress will be saved, but you won't be able to continue from where you left off.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => quitSessionMutation.mutate()}
                      disabled={quitSessionMutation.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {quitSessionMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Quitting...
                        </>
                      ) : (
                        "Quit Test"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-interview" />
        </div>

        <Card className="p-8">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Interview Question
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await enableAudio(); // Enable audio on user interaction
                    if (isSpeaking) {
                      stopSpeaking();
                    } else if (session.currentQuestion?.questionText) {
                      speak(session.currentQuestion.questionText);
                    }
                  }}
                  disabled={isTTSLoading || !session.currentQuestion?.questionText}
                  className="flex items-center gap-2"
                >
                  {isTTSLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : isSpeaking ? (
                    <>
                      <VolumeX className="h-4 w-4" />
                      Stop Reading
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" />
                      Read Question
                    </>
                  )}
                </Button>
              </div>
              <p className="text-2xl font-medium leading-relaxed" data-testid="text-question">
                {session.currentQuestion?.questionText || "Loading question..."}
              </p>
              {!hasUserInteracted && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 <strong>Tip:</strong> Click any button to enable audio playback. Questions will then play automatically.
                  </p>
                </div>
              )}
            </div>

            {session.turns && session.turns.length > 0 && (
              <div className="pt-6 border-t border-border space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Your Answer
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                    <p className="text-sm leading-relaxed" data-testid="text-user-answer">
                      {session.turns[session.turns.length - 1]?.userAnswer}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    AI Feedback
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm leading-relaxed" data-testid="text-ai-response">
                      {session.turns[session.turns.length - 1]?.aiResponse}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Answer</label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here or use voice input..."
                className="min-h-[200px] resize-none"
                disabled={submitAnswerMutation.isPending}
                data-testid="textarea-answer"
              />
            </div>

            {/* Speech-to-Text Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "outline"}
                  size="sm"
                  onClick={isListening ? handleStopListening : handleStartListening}
                  disabled={submitAnswerMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {isListening ? (
                    <>
                      <Square className="h-4 w-4" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Start Voice Input
                    </>
                  )}
                </Button>

                {isListening && (
                  <div className="flex items-center gap-2 text-sm">
                    {countdown > 0 ? (
                      <span className="text-orange-600 font-medium animate-pulse">
                        ⏰ Auto-submitting in {countdown}s... Speak to cancel
                      </span>
                    ) : (
                      <span className="text-green-600">🎤 Listening... Speak now</span>
                    )}
                  </div>
                )}
              </div>

              {/* Speech Status Messages */}
              {speechError && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                  {speechError}
                </div>
              )}

              {!isSupported && (
                <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                  Speech recognition is not supported in this browser. Please use Chrome or Edge for voice input.
                </div>
              )}

              {/* Interim transcript display */}
              {interimTranscript && (
                <div className="text-sm text-gray-600 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <span className="font-medium">Live transcript:</span> {interimTranscript}
                </div>
              )}
            </div>
            

            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Take your time and provide a thoughtful answer
              </p>
              <Button
                onClick={handleSubmit}
                disabled={submitAnswerMutation.isPending || !answer.trim()}
                data-testid="button-submit-answer"
              >
                {submitAnswerMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <SendHorizontal className="h-4 w-4 mr-2" />
                    Submit Answer
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
