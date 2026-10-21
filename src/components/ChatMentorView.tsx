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
          <div key={index} className="my-2.5 rounded-xl bg-[#060a14] border border-white/10 overflow-hidden">
            {lang && (
              <div className="px-3 py-1 bg-white/5 border-b border-white/5 text-[10px] font-mono text-cyan-400">
                {lang}
              </div>
            )}
            <pre className="p-3 text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed">
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
                {isBullet && <span className="absolute left-1 text-cyan-400">•</span>}
                {content.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((sub, sIdx) => {
                  if (sub.startsWith('`') && sub.endsWith('`')) {
                    return (
                      <code
                        key={sIdx}
                        className="px-1.5 py-0.5 rounded bg-black/40 text-cyan-300 font-mono text-[11px] border border-white/5"
                      >
                        {sub.slice(1, -1)}
                      </code>
                    );
                  }
                  if (sub.startsWith('**') && sub.endsWith('**')) {
                    return (
                      <strong key={sIdx} className="font-bold text-white">
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
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            24/7 Open Source Mentorship
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Ask Mentor AI</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Get instant answers to git confusion, open-source etiquette, and code review feedback.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetChat}
          className="self-start sm:self-auto flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear Chat
        </button>
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] text-slate-400 font-semibold shrink-0">Try asking:</span>
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(q)}
            className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl flex flex-col h-[520px] overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-purple-600 text-white'
                      : 'bg-gradient-to-tr from-cyan-500 to-purple-600 text-white shadow-sm shadow-cyan-500/20'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
                      : 'bg-[#080d1a] border border-white/10 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <div>{renderFormattedText(msg.text)}</div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-white/50 pt-1">
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors ml-4"
                      >
                        {copiedKey === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
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
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-[#080d1a] border border-white/10 p-4 text-slate-400 text-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-slate-400">Mentor is formulating guidance...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error bar */}
        {error && (
          <div className="px-4 py-2 bg-red-950/60 border-t border-red-500/30 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-white/10">
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
              className="flex-1 bg-[#080d1a] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
