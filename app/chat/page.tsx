'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useFinance } from '@/lib/finance-context';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Thread {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const THREADS_KEY = 'chat_threads';
const MAX_THREADS = 3;

const suggestedQuestions = [
  "What's our net worth at retirement?",
  "When is the mortgage paid off?",
  "How much do we spend on education total?",
  "What will our super balance be at 60?",
  "How much tax do we pay combined?",
  "What's our disposable income after expenses?",
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadThreads(): Thread[] {
  try {
    const stored = localStorage.getItem(THREADS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveThreads(threads: Thread[]): void {
  try {
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  } catch {
    // ignore storage errors
  }
}

export default function ChatPage() {
  const finance = useFinance();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLoadedRef = useRef(false);

  // Load threads from localStorage on mount and resume the most recent one
  useEffect(() => {
    const stored = loadThreads();
    const sorted = [...stored].sort((a, b) => b.updatedAt - a.updatedAt);
    hasLoadedRef.current = true;
    setThreads(sorted);
    if (sorted.length > 0) {
      setActiveThreadId(sorted[0].id);
      setMessages(sorted[0].messages);
    }
  }, []);

  // Persist threads to localStorage whenever they change (after initial load)
  useEffect(() => {
    if (hasLoadedRef.current) {
      saveThreads(threads);
    }
  }, [threads]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persist a thread to localStorage, enforcing the MAX_THREADS limit
  const persistThread = useCallback(
    (threadId: string, threadMessages: Message[], title?: string) => {
      setThreads(prev => {
        const exists = prev.find(t => t.id === threadId);
        let updated: Thread[];

        if (exists) {
          updated = prev.map(t =>
            t.id === threadId
              ? {
                  ...t,
                  messages: threadMessages,
                  updatedAt: Date.now(),
                  ...(title ? { title } : {}),
                }
              : t,
          );
        } else {
          const newThread: Thread = {
            id: threadId,
            title: title ?? 'New Chat',
            messages: threadMessages,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          // Sort by most-recently-updated, keep only MAX_THREADS
          const all = [...prev, newThread].sort((a, b) => b.updatedAt - a.updatedAt);
          updated = all.slice(0, MAX_THREADS);
        }

        return updated;
      });
    },
    [],
  );

  const startNewThread = () => {
    setActiveThreadId(null);
    setMessages([]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const switchThread = (thread: Thread) => {
    setActiveThreadId(thread.id);
    setMessages(thread.messages);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const financialData = {
    financialYear: finance.financialYear,
    includeMedicare: finance.includeMedicare,
    andyIncome: finance.andyIncome,
    nadieleIncome: finance.nadieleIncome,
    andyVoluntarySuper: finance.andyVoluntarySuper,
    nadieleVoluntarySuper: finance.nadieleVoluntarySuper,
    andyPortfolioContribution: finance.andyPortfolioContribution,
    nadielePortfolioContribution: finance.nadielePortfolioContribution,
    expenses: finance.expenses,
    andyCurrentAge: finance.andyCurrentAge,
    nadieleCurrentAge: finance.nadieleCurrentAge,
    andyRetirementAge: finance.andyRetirementAge,
    nadieleRetirementAge: finance.nadieleRetirementAge,
    annualIncomeIncrease: finance.annualIncomeIncrease,
    annualInflationRate: finance.annualInflationRate,
    splurgeAutoInvestThreshold: finance.splurgeAutoInvestThreshold,
    assets: finance.assets,
    andyNovatedLease: finance.andyNovatedLease,
    nadieleNovatedLease: finance.nadieleNovatedLease,
    children: finance.children,
    educationFees: finance.educationFees,
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Assign a thread ID if this is a new conversation
    let threadId = activeThreadId;
    if (!threadId) {
      threadId = generateId();
      setActiveThreadId(threadId);
    }

    // Auto-title from the first user message
    const isFirstMessage = messages.length === 0;
    const title = isFirstMessage
      ? content.trim().slice(0, 48) + (content.trim().length > 48 ? '…' : '')
      : undefined;

    // Add placeholder assistant message for streaming
    const assistantPlaceholder: Message = { role: 'assistant', content: '' };
    setMessages([...newMessages, assistantPlaceholder]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, financialData }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: accumulated };
          return updated;
        });
      }

      // Persist the completed thread
      const finalMessages: Message[] = [
        ...newMessages,
        { role: 'assistant', content: accumulated },
      ];
      persistThread(threadId, finalMessages, title);
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Threads sorted most-recent-first for the UI bar
  const sortedThreads = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold text-charcoal">
          AI <span className="text-tan">Chat</span>
        </h1>
        <button
          onClick={startNewThread}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-charcoal border border-gray-custom rounded-lg hover:border-tan hover:bg-tan/5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Thread history bar (visible when there are saved threads) */}
      {sortedThreads.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {sortedThreads.map(thread => (
            <button
              key={thread.id}
              onClick={() => switchThread(thread)}
              title={thread.title}
              className={`flex-shrink-0 max-w-[200px] px-3 py-1.5 text-xs rounded-full border transition-colors truncate ${
                thread.id === activeThreadId
                  ? 'bg-charcoal text-white border-charcoal'
                  : 'bg-white text-charcoal border-gray-custom hover:border-tan hover:bg-tan/5'
              }`}
            >
              {thread.title}
            </button>
          ))}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-charcoal/40 mb-6">
              <svg
                className="w-12 h-12 mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
              <p className="text-lg font-medium">Ask me about your finances</p>
              <p className="text-sm mt-1">I have access to all your financial data and projections</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {suggestedQuestions.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-2 text-sm bg-white border border-gray-custom rounded-lg hover:border-tan hover:bg-tan/5 text-charcoal transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-charcoal text-white rounded-br-md'
                  : 'bg-white border border-gray-custom rounded-bl-md'
              }`}
            >
              {msg.content}
              {isLoading &&
                i === messages.length - 1 &&
                msg.role === 'assistant' &&
                msg.content === '' && (
                  <span className="inline-flex gap-1">
                    <span
                      className="w-1.5 h-1.5 bg-charcoal/40 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-charcoal/40 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-charcoal/40 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </span>
                )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t border-gray-custom">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your finances..."
          disabled={isLoading}
          className="flex-1 border border-gray-custom rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-tan disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-3 bg-charcoal text-white rounded-lg text-sm font-medium hover:bg-charcoal-dark disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
