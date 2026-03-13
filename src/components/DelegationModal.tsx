import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Copy, CheckCheck, UserCheck, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import type { Task } from '../types';
import { streamDelegationEmail } from '../services/claudeApi';

interface DelegationModalProps {
  task: Task;
  onDelegate: (delegatedTo: string, followUpDate?: string, emailDraft?: string) => void;
  onClose: () => void;
}

export function DelegationModal({ task, onDelegate, onClose }: DelegationModalProps) {
  const [delegatee, setDelegatee] = useState(task.delegatedTo ?? '');
  const [followUpDate, setFollowUpDate] = useState(task.followUpDate ?? '');
  const [emailDraft, setEmailDraft] = useState(task.delegationEmailDraft ?? '');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Auto-scroll textarea as content streams in
  useEffect(() => {
    if (textareaRef.current && isStreaming) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [emailDraft, isStreaming]);

  const handleGenerateEmail = async () => {
    if (!delegatee.trim()) {
      setError('Enter a name to delegate to first.');
      return;
    }
    if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
      setError('No API key found. Create a .env file with VITE_ANTHROPIC_API_KEY=your_key');
      return;
    }
    setError(null);
    setEmailDraft('');
    setIsStreaming(true);

    await streamDelegationEmail(
      task,
      delegatee,
      followUpDate || undefined,
      (chunk) => setEmailDraft(prev => prev + chunk),
      () => setIsStreaming(false),
      (err) => { setError(err); setIsStreaming(false); },
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(emailDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelegate = () => {
    if (!delegatee.trim()) {
      setError('Enter a name to delegate to.');
      return;
    }
    onDelegate(delegatee.trim(), followUpDate || undefined, emailDraft || undefined);
    onClose();
  };

  const hasApiKey = !!import.meta.env.VITE_ANTHROPIC_API_KEY;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#1A1035] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-amber-500/20 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <UserCheck size={18} className="text-amber-400" />
              <h2 className="text-lg font-black text-white">Delegate Task</h2>
            </div>
            <p className="text-xs text-amber-400/70 font-medium max-w-sm truncate">{task.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Delegate to + follow-up row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Delegate To *
              </label>
              <input
                autoFocus
                value={delegatee}
                onChange={e => setDelegatee(e.target.value)}
                placeholder="Name or email..."
                className="w-full bg-black/30 border border-[#2A2640] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                <Calendar size={10} />
                Follow-up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                className="w-full bg-black/30 border border-[#2A2640] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Task context summary */}
          <div className="p-3 rounded-xl bg-white/3 border border-white/8">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Task Context</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400">
              <div><span className="text-gray-600">Priority:</span> <span className="text-white capitalize">{task.priority}</span></div>
              <div><span className="text-gray-600">Due:</span> <span className="text-white">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None set'}</span></div>
              {task.description && (
                <div className="col-span-2"><span className="text-gray-600">Details:</span> <span className="text-white">{task.description}</span></div>
              )}
              {task.commitmentNote && (
                <div className="col-span-2"><span className="text-gray-600">Commitment:</span> <span className="text-amber-300">{task.commitmentNote}</span></div>
              )}
            </div>
          </div>

          {/* AI Email Draft */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                AI Delegation Email
              </label>
              <div className="flex items-center gap-2">
                {emailDraft && !isStreaming && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                  >
                    {copied ? <><CheckCheck size={11} className="text-emerald-400" /> Copied!</> : <><Copy size={11} /> Copy</>}
                  </button>
                )}
                <button
                  onClick={handleGenerateEmail}
                  disabled={isStreaming || !delegatee.trim()}
                  className={`
                    flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all
                    ${isStreaming || !delegatee.trim()
                      ? 'bg-purple-500/20 text-purple-400/50 cursor-not-allowed'
                      : 'bg-violet-600 hover:bg-violet-500 text-white hover:shadow-lg hover:shadow-purple-500/20'
                    }
                  `}
                >
                  {isStreaming
                    ? <><Loader2 size={11} className="animate-spin" /> Drafting...</>
                    : <><Sparkles size={11} /> {emailDraft ? 'Regenerate' : 'Draft with AI'}</>
                  }
                </button>
              </div>
            </div>

            {!hasApiKey && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-3">
                <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-300">
                  Add <code className="bg-black/30 px-1 rounded text-amber-200">VITE_ANTHROPIC_API_KEY</code> to a <code className="bg-black/30 px-1 rounded text-amber-200">.env</code> file to enable AI email drafting.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-3">
                <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            {emailDraft || isStreaming ? (
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={emailDraft}
                  onChange={e => setEmailDraft(e.target.value)}
                  rows={14}
                  className="w-full bg-black/30 border border-purple-500/20 rounded-xl px-4 py-3 text-white text-xs leading-relaxed placeholder-gray-600 focus:outline-none focus:border-purple-500/40 resize-none font-mono transition-colors"
                  placeholder="Email will appear here..."
                />
                {isStreaming && (
                  <div className="absolute bottom-3 right-3">
                    <span className="inline-block w-1.5 h-4 bg-purple-400 animate-pulse rounded-sm" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-28 rounded-xl border border-dashed border-[#2A2640] text-center text-gray-600">
                <Sparkles size={20} className="mb-2 opacity-30" />
                <p className="text-xs">
                  {hasApiKey
                    ? 'Enter a name above, then click "Draft with AI"'
                    : 'Add your API key to enable AI drafting'}
                </p>
              </div>
            )}
          </div>

          {/* Delegation methodology note */}
          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15">
            <p className="text-[10px] font-bold text-purple-400/70 uppercase tracking-widest mb-1">Delegation Framework Used</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              The email is structured using <strong className="text-gray-400">Situational Leadership</strong> principles: clear task context, defined authority level, measurable outcomes, and a built-in check-in plan to support follow-through.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#2A2640] shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#2A2640] text-gray-400 hover:text-white hover:border-gray-500 font-semibold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelegate}
            disabled={!delegatee.trim()}
            className={`
              flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
              ${delegatee.trim()
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white hover:shadow-lg hover:shadow-amber-500/25'
                : 'bg-amber-500/20 text-amber-400/50 cursor-not-allowed'
              }
            `}
          >
            <UserCheck size={15} />
            Mark as Delegated
          </button>
        </div>
      </div>
    </div>
  );
}
