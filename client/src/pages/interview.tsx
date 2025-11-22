import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { SendHorizontal, Loader2, Mic, MicOff, PhoneMissed, MessageSquare, RefreshCw, Settings, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import type { InterviewSession, InterviewTurn } from "@shared/schema";
import { InterviewerAgent } from "@/components/InterviewerAgent";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Interview() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [answer, setAnswer] = useState("");
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeoutId, setTypingTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [interviewerGender, setInterviewerGender] = useState<'male' | 'female'>('male');
  const answerRef = useRef(answer);
  const answerBeforeListeningRef = useRef("");

  // Update ref when answer changes
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  const { data: session, isLoading } = useQuery<InterviewSession & {
    currentQuestion?: { questionText: string };
    turns?: InterviewTurn[];
    totalQuestions?: number;
    voiceAutoSubmitTimeout?: number;
  }>({
    queryKey: ["/api/sessions", sessionId],
    queryFn: async () => {
      const data = await apiRequest("GET", `/api/sessions/${sessionId}`);
      return data;
    },
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "completed") {
        return false;
      }
      return 1000;
    },
  });

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
      }
    };
  }, [typingTimeoutId]);

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
      console.log("Auto-submitting. isManualEdit:", isManualEdit, "isTyping:", isTyping);
      if (isTyping) {
        return;
      }

      const answerFromRef = answerRef.current.trim();
      const answerFromTranscript = transcript.trim();

      let answerToSubmit = answerFromRef || answerFromTranscript;
      if (answerFromRef && answerFromTranscript) {
        answerToSubmit = answerFromRef.length >= answerFromTranscript.length
          ? answerFromRef
          : answerFromTranscript;
      }

      if (answerToSubmit.length > 1) {
        submitAnswerMutation.mutate(answerToSubmit);
      }
    },
    autoStart: false,
    silenceTimeout: session?.voiceAutoSubmitTimeout || 4000
  });

  // Sync answer with transcript
  useEffect(() => {
    if (isListening && !isManualEdit) {
      const fullTranscript = transcript + (interimTranscript || '');
      const prefix = answerBeforeListeningRef.current;
      const spacing = prefix && fullTranscript ? " " : "";
      setAnswer(prefix + spacing + fullTranscript);
    }
  }, [isListening, transcript, interimTranscript, isManualEdit]);

  // Text-to-speech functionality
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    enableAudio,
  } = useTextToSpeech({
    apiKey: 'AIzaSyAX8RFLowa84x31YUn2oHiv7AXyEu9niEc',
    language: 'en-US',
    voiceName: interviewerGender === 'male' ? 'en-US-Neural2-D' : 'en-US-Neural2-F',
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Text-to-Speech Error",
        description: error,
      });
    },
    onEnd: () => {
      if (isSupported && !isListening) {
        handleStartListening();
      }
    },
  });

  // Auto-read question when it changes
  useEffect(() => {
    if (session?.currentQuestion?.questionText) {
      setAnswer("");
      setIsManualEdit(false);
      resetTranscript();
      if (isListening) {
        handleStopListening();
      }
      speak(session.currentQuestion.questionText);
    }

    return () => {
      stopSpeaking();
    };
  }, [session?.currentQuestion?.questionText]);

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
    await enableAudio();
    if (!answer.trim()) {
      toast({
        variant: "destructive",
        title: "Empty answer",
        description: "Please provide an answer before submitting",
      });
      return;
    }
    setIsManualEdit(false);
    submitAnswerMutation.mutate(answer);
  };

  const handleManualEdit = () => {
    setIsManualEdit(true);
    setIsTyping(false);
    if (isListening) {
      handleStopListening();
    }
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newAnswer = e.target.value;
    setAnswer(newAnswer);

    if (!isManualEdit) {
      setIsManualEdit(true);
      if (isListening) {
        handleStopListening();
      }
    }

    setIsTyping(true);
    if (typingTimeoutId) {
      clearTimeout(typingTimeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      setIsTyping(false);
    }, 2000);

    setTypingTimeoutId(newTimeoutId);
  };

  const handleStartListening = async () => {
    await enableAudio();
    if (!isSupported) {
      toast({
        variant: "destructive",
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please use a modern browser like Chrome or Edge.",
      });
      return;
    }
    // Save the current answer before clearing/resetting for new speech
    answerBeforeListeningRef.current = answer;
    setIsManualEdit(false);
    resetTranscript();
    startListening();
  };

  const handleStopListening = () => {
    try {
      stopListening();
    } catch (error) {
      console.error("Error stopping speech recognition:", error);
    }
  };

  const handleAskAgain = async () => {
    if (session?.currentQuestion?.questionText) {
      if (isListening) {
        handleStopListening();
      }
      await enableAudio();
      speak(session.currentQuestion.questionText);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-slate-400">Connecting to interview session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Session not found</p>
          <Button onClick={() => setLocation("/tests")} variant="secondary">
            Back to Tests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 flex flex-col text-slate-200 font-sans">
      {/* Header */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="font-medium text-sm text-slate-300">Live Interview Session</span>
          <span className="text-slate-600 text-xs">|</span>
          <span className="text-xs text-slate-500 font-mono">ID: {sessionId?.slice(0, 8)}</span>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Question {session.currentQuestionIndex + 1} / {session.totalQuestions}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Left Stage - Interviewer */}
        <div className="h-[40vh] md:h-auto md:flex-1 relative flex flex-col items-center justify-center bg-[#121212] p-4 md:p-8">

          {/* Agent Container */}
          <div className="relative transform scale-75 md:scale-125 transition-transform duration-500">
            <InterviewerAgent isSpeaking={isSpeaking} gender={interviewerGender} />
          </div>

          {/* Captions Overlay */}
          <div className="absolute bottom-4 md:bottom-8 left-0 right-0 px-4 md:px-8 flex justify-center">
            <div className="bg-black/60 backdrop-blur-md p-3 md:p-6 rounded-2xl max-w-3xl w-full border border-white/5 shadow-2xl transition-all duration-300 hover:bg-black/70">
              <h3 className="text-[10px] md:text-xs uppercase tracking-widest text-blue-400 mb-1 md:mb-2 font-bold">
                {interviewerGender === 'male' ? 'Alex' : 'Sarah'}
              </h3>
              <p className="text-sm md:text-xl leading-relaxed text-white font-medium line-clamp-3 md:line-clamp-none">
                {session.currentQuestion?.questionText || "..."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Chat/Answer */}
        <div className="flex-1 md:flex-none w-full md:w-96 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col shadow-2xl z-20">
          <div className="p-3 md:p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
            <h2 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Your Response
            </h2>
            {isListening && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-orange-400 font-mono">
                  {countdown > 0 ? `${countdown}s` : ''}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-900/30 px-2 py-1 rounded-full border border-green-500/30">
                  Listening
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 p-3 md:p-4 flex flex-col gap-2 overflow-y-auto bg-slate-950/30 min-h-0">
            <div className="flex-1 relative">
              <Textarea
                value={answer}
                onChange={handleAnswerChange}
                onFocus={handleManualEdit}
                placeholder={isSpeaking ? "Listening to question..." : "Type your answer here..."}
                className="w-full h-full resize-none bg-transparent border-0 focus:ring-0 text-slate-300 p-0 text-sm leading-relaxed placeholder:text-slate-600"
                disabled={submitAnswerMutation.isPending}
              />

              {/* Interim Transcript Overlay */}
              {interimTranscript && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-blue-900/20 border-t border-blue-500/20 text-blue-200 text-xs italic">
                  {interimTranscript}
                </div>
              )}
            </div>
          </div>

          <div className="p-2 md:p-4 border-t border-slate-800 bg-slate-900 text-[10px] md:text-xs text-slate-500 text-center hidden md:block shrink-0">
            {isListening ? "Speak clearly into your microphone" : "Type or use voice to answer"}
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 px-8 relative z-30 shrink-0">

        {/* Ask Again Button */}
        <button
          onClick={handleAskAgain}
          disabled={isSpeaking}
          className="h-12 w-12 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-slate-700 disabled:opacity-50"
          title="Ask Question Again"
        >
          <RefreshCw className={`w-5 h-5 ${isSpeaking ? 'animate-spin' : ''}`} />
        </button>

        {/* Mic Toggle */}
        <button
          onClick={isListening ? handleStopListening : handleStartListening}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 ${isListening
            ? 'bg-slate-700 text-white hover:bg-slate-600'
            : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
            }`}
          title={isListening ? "Mute Microphone" : "Unmute Microphone"}
        >
          {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || submitAnswerMutation.isPending}
          className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
        >
          {submitAnswerMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <SendHorizontal className="w-5 h-5" />
          )}
          <span>Submit Answer</span>
        </button>

        {/* Settings / Gender Selection */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="h-12 w-12 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all ml-4 border border-slate-700"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200 w-56">
            <DropdownMenuLabel>Select Interviewer</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem onClick={() => setInterviewerGender('male')} className="hover:bg-slate-800 cursor-pointer flex items-center justify-between">
              <span>Alex</span>
              {interviewerGender === 'male' && <Check className="w-4 h-4 text-blue-400" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setInterviewerGender('female')} className="hover:bg-slate-800 cursor-pointer flex items-center justify-between">
              <span>Sarah</span>
              {interviewerGender === 'female' && <Check className="w-4 h-4 text-blue-400" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quit Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="h-12 w-16 rounded-full bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all ml-4 border border-slate-700 hover:border-red-900"
              title="Leave Call"
            >
              <PhoneMissed className="w-5 h-5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-200">
            <AlertDialogHeader>
              <AlertDialogTitle>Leave Interview?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Are you sure you want to end this session? Your progress will be saved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => quitSessionMutation.mutate()}
                className="bg-red-600 hover:bg-red-700 text-white border-0"
              >
                Leave
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
