'use client';

import { useState, KeyboardEvent, useEffect, useRef } from 'react';

interface ChatComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  onActivity?: () => void; // Callback for activity tracking
}

export default function ChatComposer({ onSend, disabled, onActivity }: ChatComposerProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = navigator.language || 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
        if (onActivity) onActivity();
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Silently handle errors - just stop listening and allow typing
        setIsListening(false);
        if (onActivity) onActivity();
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onActivity]);

  // Stop listening on visibility change, tab blur, or when component unmounts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    };

    const handleBlur = () => {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      // Stop listening if active
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      onSend(input.trim());
      setInput('');
      if (onActivity) onActivity();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (onActivity) onActivity();
  };

  const handleMicClick = () => {
    if (!speechSupported || disabled || !recognitionRef.current) return;

    if (isListening) {
      // Stop listening
      recognitionRef.current.stop();
      setIsListening(false);
      if (onActivity) onActivity();
    } else {
      // Start listening
      try {
        recognitionRef.current.start();
        setIsListening(true);
        if (onActivity) onActivity();
      } catch (error) {
        // Silently handle - permission denied or already listening
        setIsListening(false);
        // No error message shown - user can just type
      }
    }
  };

  // Stop listening if component becomes disabled (e.g., kiosk lock)
  useEffect(() => {
    if (disabled && isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [disabled, isListening]);

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (onActivity) onActivity();
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type your message..."
            rows={1}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 pr-12 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          {speechSupported && (
            <button
              onClick={handleMicClick}
              disabled={disabled}
              type="button"
              className={`absolute right-2 bottom-2 p-2 rounded-full transition-colors ${
                isListening
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-500 text-center">You can type or speak.</p>
    </div>
  );
}
