import React, { useState, useRef, useCallback } from 'react';

interface SpeechToTextOptions {
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
  onAutoSubmit?: (transcript: string) => void;
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  autoStart?: boolean;
  silenceTimeout?: number; // in milliseconds
}

interface SpeechToTextReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  resetTranscript: () => void;
  countdown: number;
}

export function useSpeechToText({
  onResult,
  onError,
  onAutoSubmit,
  continuous = true,
  interimResults = true,
  language = 'en-US',
  autoStart = false,
  silenceTimeout = 4000
}: SpeechToTextOptions = {}): SpeechToTextReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef('');
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const isListeningRef = useRef<boolean>(false);
  const isSupported = typeof window !== 'undefined' && 'webkitSpeechRecognition' in window;

  // Clear silence timeout
  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  // Clear countdown
  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(0);
  }, []);

  // Clear silence check
  const clearSilenceCheck = useCallback(() => {
    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;
    }
  }, []);

  // Set silence timeout
  const setSilenceTimeout = useCallback(() => {
    clearSilenceTimeout();
    clearCountdown();

    // Start countdown
    const countdownSeconds = Math.ceil(silenceTimeout / 1000);
    setCountdown(countdownSeconds);

    let currentCount = countdownSeconds;
    countdownIntervalRef.current = setInterval(() => {
      currentCount--;
      setCountdown(currentCount);
    }, 1000);

    console.log("Setting silence timeout for", silenceTimeout, "ms");
    silenceTimeoutRef.current = setTimeout(() => {
      console.log("Silence timeout triggered, isListening:", isListeningRef.current);
      if (isListeningRef.current) {
        console.log("Stopping recognition and calling auto-submit with transcript:", transcriptRef.current);
        // Stop listening first
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        isListeningRef.current = false;
        setIsListening(false);
        clearSilenceTimeout();
        clearCountdown();

        // Then call auto-submit with current transcript
        onAutoSubmit?.(transcriptRef.current);
      }
    }, silenceTimeout);
  }, [silenceTimeout, clearSilenceTimeout, clearCountdown, onAutoSubmit]);

  const startListening = useCallback(() => {
    console.log("useSpeechToText: startListening called");
    console.log("isSupported:", isSupported);
    console.log("isListening:", isListening);

    if (!isSupported) {
      console.log("Speech recognition not supported in browser");
      setError('Speech recognition is not supported in this browser');
      onError?.('Speech recognition is not supported in this browser');
      return;
    }

    if (isListening) {
      console.log("Already listening, ignoring start request");
      return;
    }

    try {
      console.log("Creating SpeechRecognition instance...");
      const SpeechRecognition = window.webkitSpeechRecognition || (window as any).SpeechRecognition;
      console.log("SpeechRecognition constructor:", SpeechRecognition);
      const recognition = new SpeechRecognition();
      console.log("Recognition instance created:", recognition);

      recognition.continuous = true; // Always use continuous for better silence detection
      recognition.interimResults = true; // Always use interim results
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("Speech recognition started successfully");
        setIsListening(true);
        isListeningRef.current = true;
        setError(null);
        lastSpeechTimeRef.current = Date.now();
        setSilenceTimeout();

        // Start periodic silence check as fallback
        clearSilenceCheck();
        silenceCheckIntervalRef.current = setInterval(() => {
          if (isListeningRef.current) {
            const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
            if (timeSinceLastSpeech >= silenceTimeout) {
              // Trigger auto-submit
              if (recognitionRef.current) {
                recognitionRef.current.stop();
              }
              isListeningRef.current = false;
              setIsListening(false);
              clearSilenceTimeout();
              clearCountdown();
              clearSilenceCheck();
              onAutoSubmit?.(transcriptRef.current);
            }
          }
        }, 1000); // Check every second
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log("Speech recognition result received:", event);
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          console.log(`Result ${i}: "${transcript}" (isFinal: ${result.isFinal})`);

          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Update last speech time and reset silence timeout
        if (finalTranscript || interimTranscript) {
          lastSpeechTimeRef.current = Date.now();
          // Clear existing timeout and set a new one
          clearSilenceTimeout();
          clearCountdown();
          setSilenceTimeout();
        }

        if (finalTranscript) {
          setTranscript(prev => {
            const newTranscript = prev + finalTranscript;
            transcriptRef.current = newTranscript;
            onResult?.(finalTranscript);
            return newTranscript;
          });
        }

        setInterimTranscript(interimTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        try {
          console.error('Speech recognition error:', event.error, event.message);
          let errorMessage = 'Speech recognition error occurred';

          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech was detected. Please try again.';
              break;
            case 'audio-capture':
              errorMessage = 'No microphone was found. Please check your microphone.';
              break;
            case 'not-allowed':
              errorMessage = 'Permission to use microphone was denied.';
              break;
            case 'service-not-allowed':
              errorMessage = 'Speech recognition service is not allowed.';
              break;
            case 'bad-grammar':
              errorMessage = 'Speech recognition grammar error.';
              break;
            case 'language-not-supported':
              errorMessage = 'Language not supported for speech recognition.';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
          }

          setError(errorMessage);
          onError?.(errorMessage);
          setIsListening(false);
          isListeningRef.current = false;
          clearSilenceTimeout();
          clearCountdown();
          clearSilenceCheck();
        } catch (error) {
          console.error('Error in onerror handler:', error);
          // Force cleanup even if there's an error
          setIsListening(false);
          isListeningRef.current = false;
          clearSilenceTimeout();
          clearCountdown();
          clearSilenceCheck();
        }
      };

      recognition.onend = () => {
        try {
          console.log('Speech recognition onend event triggered');
          setIsListening(false);
          isListeningRef.current = false;
          setInterimTranscript('');
          clearSilenceTimeout();
          clearCountdown();
          clearSilenceCheck();
        } catch (error) {
          console.error('Error in onend handler:', error);
          // Force cleanup even if there's an error
          setIsListening(false);
          isListeningRef.current = false;
          setInterimTranscript('');
          clearSilenceTimeout();
          clearCountdown();
          clearSilenceCheck();
        }
      };

      recognitionRef.current = recognition;
      console.log("Starting speech recognition...");
      recognition.start();
      console.log("Speech recognition start() called");
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      const errorMessage = 'Failed to start speech recognition';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [isSupported, isListening, continuous, interimResults, language, onResult, onError, setSilenceTimeout]);

  const stopListening = useCallback(() => {
    try {
      console.log('stopListening called, isListening:', isListening, 'recognitionRef.current:', !!recognitionRef.current);

      if (recognitionRef.current && isListening) {
        console.log('Stopping speech recognition');
        recognitionRef.current.stop();
      }

      isListeningRef.current = false;
      setIsListening(false);
      clearSilenceTimeout();
      clearCountdown();
      clearSilenceCheck();

      console.log('Stop listening completed successfully');
    } catch (error) {
      console.error('Error in stopListening:', error);
      // Force stop even if there's an error
      isListeningRef.current = false;
      setIsListening(false);
      clearSilenceTimeout();
      clearCountdown();
      clearSilenceCheck();
    }
  }, [isListening, clearSilenceTimeout, clearCountdown, clearSilenceCheck]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Auto-start functionality
  const autoStartRef = useRef(autoStart);
  autoStartRef.current = autoStart;

  // Start listening automatically if enabled
  React.useEffect(() => {
    if (autoStartRef.current && isSupported && !isListening) {
      startListening();
    }
  }, [isSupported, isListening, startListening]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearSilenceTimeout();
      clearCountdown();
      clearSilenceCheck();
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [clearSilenceTimeout, clearCountdown, clearSilenceCheck, isListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
    interimTranscript,
    error,
    resetTranscript,
    countdown
  };
}
