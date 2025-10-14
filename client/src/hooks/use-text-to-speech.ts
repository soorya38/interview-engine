import { useState, useRef, useCallback } from 'react';

interface TextToSpeechOptions {
  apiKey: string;
  language?: string;
  voiceName?: string;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

interface TextToSpeechReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useTextToSpeech({
  apiKey,
  language = 'en-US',
  voiceName = 'en-US-Neural2-F',
  onError,
  onStart,
  onEnd,
}: TextToSpeechOptions): TextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) {
      return;
    }

    // Stop any currently playing audio
    stop();

    setIsLoading(true);
    setError(null);

    try {
      // Call Google Cloud Text-to-Speech API
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: language,
              name: voiceName,
            },
            audioConfig: {
              audioEncoding: 'MP3',
              pitch: 0,
              speakingRate: 0.95,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to synthesize speech');
      }

      const data = await response.json();
      const audioContent = data.audioContent;

      // Convert base64 to blob and create audio element
      const audioBlob = base64ToBlob(audioContent, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
        setIsLoading(false);
        onStart?.();
      };

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        onEnd?.();
      };

      audio.onerror = () => {
        const errorMsg = 'Failed to play audio';
        setError(errorMsg);
        setIsSpeaking(false);
        setIsLoading(false);
        onError?.(errorMsg);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate speech';
      setError(errorMsg);
      setIsLoading(false);
      setIsSpeaking(false);
      onError?.(errorMsg);
    }
  }, [apiKey, language, voiceName, stop, onError, onStart, onEnd]);

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
    error,
  };
}

// Helper function to convert base64 to blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

