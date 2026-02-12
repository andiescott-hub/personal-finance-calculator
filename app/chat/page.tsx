'use client';

import { useState, useRef, useEffect } from 'react';
import { useFinance } from '@/lib/finance-context';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestedQuestions = [
  "What's our net worth at retirement?",
  "When is the mortgage paid off?",
  "How much do we spend on education total?",
  "What will our super balance be at 60?",
  "How much tax do we pay combined?",
  "What's our disposable income after expenses?",
];

export default function ChatPage() {
  const finance = useFinance();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    // Add placeholder assistant message for streaming
    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages([...newMessages, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          financialData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

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

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <h1 className="text-2xl font-bold text-charcoal mb-4">
        AI <span className="text-tan">Chat</span>
      </h1>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-charcoal/40 mb-6">
              <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <p className="text-lg font-medium">Ask me about your finances</p>
              <p className="text-sm mt-1">I have access to all your financial data and projections</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {suggestedQuestions.map((q) => (
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
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-charcoal text-white rounded-br-md'
                  : 'bg-white border border-gray-custom rounded-bl-md'
              }`}
            >
              {msg.content}
              {isLoading && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '' && (
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-charcoal/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-charcoal/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-charcoal/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
          onChange={(e) => setInput(e.target.value)}
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
