'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import MessageList from './components/MessageList';
import ChatComposer from './components/ChatComposer';
import ActionCard from './components/ActionCard';
import KioskLockOverlay from './components/KioskLockOverlay';
import { ActionCard as ActionCardType, Question } from '@/lib/flow/types';

const INACTIVITY_LOCK = 2 * 60 * 1000; // 2 minutes
const SESSION_CHECK_INTERVAL = 30 * 1000; // 30 seconds

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [actionCard, setActionCard] = useState<ActionCardType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCheckRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize session
    const newSessionId = typeof window !== 'undefined' 
      ? window.crypto?.randomUUID() || Math.random().toString(36).substring(2, 15)
      : Math.random().toString(36).substring(2, 15);
    setSessionId(newSessionId);

    // Check for initial message from home page
    if (typeof window !== 'undefined') {
      const initialMessage = sessionStorage.getItem('initialMessage');
      if (initialMessage) {
        sessionStorage.removeItem('initialMessage');
        setTimeout(() => handleSendMessage(initialMessage), 100);
      }
    }

    // Set up inactivity monitoring
    const resetTimer = () => {
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
      setLastActivity(Date.now());
      activityTimerRef.current = setTimeout(() => {
        checkSessionLock(newSessionId);
      }, INACTIVITY_LOCK);
    };

    // Check session lock periodically
    const checkPeriodically = () => {
      sessionCheckRef.current = setInterval(() => {
        checkSessionLock(newSessionId);
      }, SESSION_CHECK_INTERVAL);
    };

    resetTimer();
    checkPeriodically();

    const handleActivity = () => resetTimer();
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
      if (sessionCheckRef.current) clearInterval(sessionCheckRef.current);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  const checkSessionLock = async (sid: string) => {
    try {
      const response = await fetch('/api/session/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid }),
      });
      const data = await response.json();
      if (data.locked) {
        setIsLocked(true);
      }
    } catch (error) {
      console.error('Failed to check session lock:', error);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Add user message to UI
    const userMessage = { role: 'user' as const, text };
    setMessages((prev) => [...prev, userMessage]);
    setLastActivity(Date.now());
    setIsLoading(true);
    setActionCard(null);
    setCurrentQuestion(null);

    try {
      const response = await fetch('/api/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userText: text }),
      });

      if (response.status === 403 || response.status === 401) {
        setIsLocked(true);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.locked) {
        setIsLocked(true);
        setIsLoading(false);
        return;
      }

      // Handle different response types
      if (data.type === 'action_card' && data.actionCard) {
        setActionCard(data.actionCard);
        setMessages((prev) => [...prev, { role: 'assistant', text: 'Here are your next steps:' }]);
      } else if (data.type === 'question' && data.question) {
        setCurrentQuestion(data.question);
        setMessages((prev) => [...prev, { role: 'assistant', text: data.question.text }]);
      } else if (data.type === 'clarify' && data.clarifyPrompt) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.clarifyPrompt }]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: "I'm having trouble right now. Please try again in a moment." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSession = async () => {
    try {
      await fetch('/api/session/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      setMessages([]);
      setCurrentQuestion(null);
      setActionCard(null);
      setIsLocked(false);
      setLastActivity(Date.now());
    } catch (error) {
      console.error('Failed to reset session:', error);
    }
  };

  const handleContinue = () => {
    setIsLocked(false);
    setLastActivity(Date.now());
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-4">
        <h1 className="text-xl font-medium text-gray-900">Benefits Navigator</h1>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col max-w-4xl w-full mx-auto px-4 py-6">
        <MessageList messages={messages} isLoading={isLoading} />

        {actionCard && (
          <div className="mt-4 mb-4">
            <ActionCard card={actionCard} />
          </div>
        )}

        {currentQuestion && (
          <div className="mt-4 mb-4 bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-lg text-gray-900 mb-3">{currentQuestion.text}</p>
            {currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(option)}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-900 transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <ChatComposer
          onSend={handleSendMessage}
          disabled={isLoading || isLocked}
          onActivity={() => setLastActivity(Date.now())}
        />
      </main>

      {/* Privacy footer */}
      <footer className="bg-white border-t border-gray-200 py-3 px-4 text-center">
        <p className="text-sm text-gray-600">For your privacy, this clears itself automatically.</p>
      </footer>

      {/* Kiosk lock overlay */}
      {isLocked && (
        <KioskLockOverlay onContinue={handleContinue} onReset={handleResetSession} />
      )}
    </div>
  );
}
