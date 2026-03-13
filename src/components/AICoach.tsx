import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Trash2 } from 'lucide-react';
import type { Task, OKR, Decision } from '../types';
import { streamAICoach, type ChatMessage } from '../services/claudeApi';

interface AICoachProps {
  tasks: Task[];
  okrs: OKR[];
  decisions: Decision[];
  onClose: () => void;
}

const STARTERS = [
  'What should I focus on right now?',
  'Help me prioritise my tasks',
  'I\'m feeling overwhelmed — where do I start?',
  'How do I get unstuck on a hard task?',
  'Give me an ADHD tip for deep work',
];

export function AICoach({ tasks, okrs, decisions, onClose }: AICoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setError('');
    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
    setMessages(msgs => [...msgs, assistantMsg]);

    await streamAICoach(
      newMessages,
      { tasks, okrs, decisions },
      (chunk) => {
        setMessages(msgs => {
          const updated = [...msgs];
          updated[updated.length - 1] = { role: 'assistant', content: updated[updated.length - 1].content + chunk };
          return updated;
        });
      },
      () => setStreaming(false),
      (err) => { setError(err); setStreaming(false); setMessages(msgs => msgs.slice(0, -1)); },
    );
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[380px] bg-[#1A1824] border-l border-[#2A2640] flex flex-col z-40 shadow-2xl shadow-black/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#2A2640] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Coach</p>
            <p className="text-[10px] text-gray-600">ADHD-aware · knows your tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-colors"
              title="Clear conversation"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-3">
                <Bot size={20} className="text-violet-400" />
              </div>
              <p className="text-sm text-gray-300 font-medium">Your ADHD leadership coach</p>
              <p className="text-xs text-gray-600 mt-1">Ask anything about your tasks, priorities, or leadership challenges</p>
            </div>
            <div className="space-y-1.5">
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-[#1E1C28] border border-[#2A2640] hover:border-violet-500/30 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-md bg-violet-600/30 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={12} className="text-violet-400" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white'
                  : 'bg-[#1E1C28] border border-[#2A2640] text-gray-200'
              }`}>
                {msg.content}
                {msg.role === 'assistant' && streaming && i === messages.length - 1 && !msg.content && (
                  <Loader2 size={12} className="animate-spin text-gray-500" />
                )}
              </div>
            </div>
          ))
        )}
        {error && (
          <p className="text-xs text-red-400 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-[#2A2640] shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything…"
            rows={1}
            disabled={streaming}
            className="flex-1 bg-[#12111A] border border-[#2A2640] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 resize-none disabled:opacity-50 transition-colors"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || streaming}
            className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 transition-colors shrink-0"
          >
            {streaming ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
        <p className="text-[10px] text-gray-700 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
