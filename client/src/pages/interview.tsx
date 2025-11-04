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
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [editCountdown, setEditCountdown] = useState(0);
  const [editTimeoutId, setEditTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeoutId, setTypingTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const answerRef = useRef(answer);
  
  // Update ref when answer changes
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  // Speech countdown timer removed - auto-submit immediately after speech

  // Countdown timer for manual edits (DISABLED - no timer in manual edit mode)
  // When user clicks textarea, they want full manual control without timer pressure
  // useEffect(() => {
  //   if (editCountdown > 0 && !isTyping && isManualEdit) {
  //     const timer = setTimeout(() => {
  //       setEditCountdown(editCountdown - 1);
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   } else if (editCountdown === 0 && isManualEdit && answer.trim() && !isTyping) {
  //     // Auto-submit when countdown reaches 0 and user is not typing
  //     console.log("Edit countdown finished, auto-submitting answer");
  //     setIsManualEdit(false);
  //   }
  // }, [editCountdown, isManualEdit, answer, isTyping]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (editTimeoutId) {
        clearTimeout(editTimeoutId);
      }
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
      }
    };
  }, [editTimeoutId, typingTimeoutId]);

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
      // Update the answer with the current speech result
      // This will show what's being said in the textarea
      setAnswer(text);
      console.log("Speech result received:", text);
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
      console.log("Is manual edit mode:", isManualEdit);
      console.log("Is typing:", isTyping);
      
      // Don't auto-submit if user is in manual edit mode or currently typing
      if (isManualEdit || isTyping) {
        console.log("Auto-submit cancelled - User is in manual edit mode or typing");
        return;
      }
      
      // Check if transcript has more than 1 character
      if (transcript.trim().length > 1) {
        console.log("Auto-submitting speech transcript:", transcript);
        // Auto-submit the transcript directly
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
    onEnd: () => {
      // Automatically start microphone after question is read
      if (isSupported && !isListening) {
        console.log("Question finished reading, starting microphone automatically");
        handleStartListening();
      }
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

  // Speech countdown auto-submission removed - auto-submit immediately after speech

  // Handle auto-submission when edit countdown reaches 0 (DISABLED - no auto-submit in manual mode)
  // useEffect(() => {
  //   if (editCountdown === 0 && isManualEdit && answer.trim() && !isTyping) {
  //     console.log("Auto-submitting answer after edit countdown");
  //     submitAnswerMutation.mutate(answer);
  //   }
  // }, [editCountdown, isManualEdit, answer, submitAnswerMutation, isTyping]);

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
    // Reset all states when manually submitting
    setIsManualEdit(false);
    setEditCountdown(0);
    submitAnswerMutation.mutate(answer);
  };

  const handleManualEdit = () => {
    setIsManualEdit(true);
    setEditCountdown(0); // No countdown timer in manual edit mode
    setIsTyping(false); // Reset typing state
    
    // Stop speech recognition when user enters manual edit mode
    if (isListening) {
      console.log("Stopping speech recognition due to manual edit");
      handleStopListening();
    }
    
    console.log("User clicked textarea, entering manual edit mode (no timer)");
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newAnswer = e.target.value;
    setAnswer(newAnswer);
    
    // Enter manual edit mode when user starts typing
    if (!isManualEdit) {
      setIsManualEdit(true);
      console.log("User started typing, entering manual edit mode");
      
      // Stop speech recognition when user starts typing
      if (isListening) {
        console.log("Stopping speech recognition due to typing");
        handleStopListening();
      }
    }
    
    // Set typing state to true
    setIsTyping(true);
    
    // Clear existing typing timeout
    if (typingTimeoutId) {
      clearTimeout(typingTimeoutId);
    }
    
    // Set new timeout to detect when user stops typing (2 seconds)
    const newTimeoutId = setTimeout(() => {
      setIsTyping(false);
      console.log("User stopped typing");
    }, 2000);
    
    setTypingTimeoutId(newTimeoutId);
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
    
    // Clear the answer field when starting new speech session
    setAnswer("");
    setIsManualEdit(false);
    
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
                  Practice Question
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
            </div>

          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Your Answer (Click to edit)</label>
                <div className="flex items-center gap-3">
                  {isListening && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">Listening...</span>
                    </div>
                  )}
                  {isManualEdit && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-semibold">Manual edit mode - Click Submit when ready</span>
                    </div>
                  )}
                </div>
              </div>
              <Textarea
                value={answer}
                onChange={handleAnswerChange}
                onFocus={handleManualEdit}
                placeholder="Type your answer here or use voice input..."
                className={`min-h-[200px] resize-none text-base font-medium bg-white dark:bg-gray-900 border-2 focus:border-blue-500 dark:focus:border-blue-400 ${
                  isListening ? 'border-green-300 dark:border-green-600 bg-green-50/30 dark:bg-green-950/20' : ''
                } ${
                  isManualEdit ? 'border-blue-300 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-950/20' : ''
                }`}
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
                      <span className="text-orange-600 dark:text-orange-400 font-semibold animate-pulse bg-orange-50 dark:bg-orange-950/20 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                        ⏰ Auto-submitting in {countdown}s... Speak to cancel
                      </span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-950/20 px-3 py-1 rounded-full border border-green-200 dark:border-green-800">
                        🎤 Listening... Speak now
                      </span>
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
                <div className="text-base text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
                  <span className="font-semibold">🎤 Live transcript:</span> 
                  <span className="ml-2 font-medium">{interimTranscript}</span>
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
