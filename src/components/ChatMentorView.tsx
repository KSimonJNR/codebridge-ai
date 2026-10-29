import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  User,
  Bot,
  AlertTriangle,
  RotateCcw,
  Check,
  Copy,
  Terminal,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { ChatMessage } from '../types.ts';

interface ChatMentorViewProps {
  onOpenKeyInfo: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    sender: 'mentor',
    text: `👋 Hi! I'm your **CodeBridge AI Open-Source Mentor**. 

Whether you're making your first Hacktoberfest commit, figuring out Git rebase, or learning how to communicate with maintainers, I'm here to give you practical, friendly advice.

What would you like help with today?`,
    timestamp: 'Just now',
  },
];

const SUGGESTED_QUESTIONS = [
  'How do I fix a merge conflict with git rebase?',
  'What is the polite way to ask to work on an issue?',
  'What does "Squash and Merge" mean?',
  'My CI build failed on GitHub Actions. How do I debug it?',
  'What files should I never commit in a PR?',
];

export const ChatMentorView: React.FC<ChatMentorViewProps> = ({ onOpenKeyInfo }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('codebridge_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_MESSAGES;
      }
    }
    return INITIAL_MESSAGES;
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem('codebridge_chat_history', JSON.stringify(messages));
  }, [messages]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!messageText) setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-6).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.keyMissing) {
          onOpenKeyInfo();
        }
        throw new Error(data.error || 'Failed to get response from mentor.');
      }

      const mentorMessage: ChatMessage = {
        id: `mentor-${Date.now()}`,
        sender: 'mentor',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, mentorMessage]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error talking to mentor.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    localStorage.removeItem('codebridge_chat_history');
    setError(null);
  };

  // Simple Markdown formatter for bold, code blocks, and bullets
  const renderFormattedText = (raw: string) => {
    // Split by code blocks
    const parts = raw.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
        const codeContent = lang ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div key={index} className="my-2 rounded-[8px] bg-surface-2 border border-hairline overflow-hidden">
            {lang && (
              <div className="px-3 py-1 bg-surface border-b border-hairline text-[10px] font-mono text-ink-subtle">
                {lang}
              </div>
            )}
            <pre className="p-3 text-[12px] font-mono text-ink overflow-x-auto leading-relaxed">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }

      // Inline code and bold text
      const lines = part.split('\n');
      return (
        <span key={index}>
          {lines.map((line, lIdx) => {
            // Check for bullet line
            const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
            const content = isBullet ? line.trim().slice(2) : line;

            return (
              <span key={lIdx} className={`block ${isBullet ? 'pl-4 relative' : ''}`}>
                {isBullet && <span className="absolute left-1 text-accent">•</span>}
                {content.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((sub, sIdx) => {
                  if (sub.startsWith('`') && sub.endsWith('`')) {
                    return (
                      <code
                        key={sIdx}
                        className="px-1.5 py-0.5 rounded-[4px] bg-surface-2 text-ink font-mono text-[11px] border border-hairline"
                      >
                        {sub.slice(1, -1)}
                      </code>
                    );
                  }
                  if (sub.startsWith('**') && sub.endsWith('**')) {
                    return (
                      <strong key={sIdx} className="font-medium text-ink-strong">
                        {sub.slice(2, -2)}
                      </strong>
                    );
                  }
                  return sub;
                })}
              </span>
            );
          })}
        </span>
      );
    });
  };

  return (
    <div className="space-y-5 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <div className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>24/7 Open Source Mentorship</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-normal tracking-tight">
            <span className="font-medium text-ink-strong">Ask Mentor AI</span>{' '}
            <span className="font-normal text-ink-subtle">· Practical guidance</span>
          </h2>
          <p className="text-[13px] text-ink-subtle mt-0.5">
            Get instant answers to git confusion, open-source etiquette, and code review feedback.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetChat}
          className="self-start sm:self-auto h-8 px-3 rounded-[10px] text-[12px] font-medium bg-surface-2 hover:bg-surface text-ink border border-hairline transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-ink-subtle" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-medium text-ink-subtle shrink-0">Try asking:</span>
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(q)}
            className="h-7 px-2.5 rounded-[8px] bg-surface-2 hover:bg-surface border border-hairline text-ink-subtle hover:text-ink text-[12px] font-normal whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="card-71 flex flex-col h-[520px] overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 text-[11px] font-medium border border-hairline ${
                    isUser
                      ? 'bg-surface-2 text-ink'
                      : 'bg-accent text-white'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-[12px] p-3.5 text-[13px] leading-relaxed border border-hairline ${
                    isUser
                      ? 'bg-surface-2 text-ink-strong'
                      : 'bg-surface text-ink'
                  }`}
                >
                  <div>{renderFormattedText(msg.text)}</div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-ink-subtle pt-1 border-t border-hairline/50">
                    <span className="font-mono">{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="text-ink-subtle hover:text-ink flex items-center gap-1 transition-colors ml-4 cursor-pointer"
                      >
                        {copiedKey === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedKey === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-[8px] bg-accent text-white flex items-center justify-center shrink-0 border border-hairline">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="rounded-[12px] bg-surface border border-hairline p-3.5 text-ink-subtle text-[12px] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span>Mentor is formulating guidance...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error bar */}
        {error && (
          <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/25 text-rose-500 text-[12px] flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-surface-2 border-t border-hairline">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about open source, Git commands, or Hacktoberfest..."
              disabled={loading}
              className="flex-1 h-8 px-3 rounded-[10px] bg-surface border border-hairline text-[13px] text-ink placeholder:text-ink-subtle/50 focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="h-8 px-4 rounded-[10px] bg-accent hover:bg-accent-hover text-white text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
