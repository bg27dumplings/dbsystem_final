import { useState, useEffect, useCallback, useRef } from "react";

export function useSpeechRecognition(onResult?: (text: string, isFinal: boolean) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "cmn-Hant-TW";

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          let isFinal = false;
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              isFinal = true;
            }
          }
          if (onResult) {
            onResult(currentTranscript, isFinal);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setError(event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        setError("Browser does not support Speech Recognition");
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setError(null);
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return {
    isListening,
    error,
    startListening,
    stopListening,
    hasSupport: !!recognitionRef.current
  };
}
