import { useState, useEffect, useRef } from 'react';
import { Plus, X, Zap } from 'lucide-react';

interface QuickCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (text: string) => void;
}

export function QuickCapture({ open, onClose, onCapture }: QuickCaptureProps) {
  const [text, setText] = useState('');
  const [captured, setCaptured] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setText('');
      setCaptured(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const submit = () => {
    if (!text.trim()) return;
    onCapture(text.trim());
    setCaptured(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4 sm:items-center sm:pb-0"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg animate-[slideUp_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {captured ? (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-5 flex items-center gap-3">
            <Zap size={18} className="text-emerald-400" />
            <p className="text-sm font-bold text-emerald-400">Captured to Brain Dump!</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#0C0820] border border-purple-500/30 shadow-2xl shadow-purple-500/10 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2D1F5E]">
              <Zap size={14} className="text-purple-400 shrink-0" />
              <p className="text-xs font-black text-purple-400 uppercase tracking-widest flex-1">
                Quick Capture
              </p>
              <span className="text-[10px] text-gray-600 font-mono">ESC to close</span>
              <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="p-4">
              <input
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') submit();
                  if (e.key === 'Escape') onClose();
                }}
                placeholder="What's on your mind? Hit Enter to capture…"
                className="w-full bg-transparent text-white text-base placeholder-gray-600 focus:outline-none py-1"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#2D1F5E]">
              <p className="text-[11px] text-gray-600">Goes to Brain Dump inbox — triage later</p>
              <button
                onClick={submit}
                disabled={!text.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold transition-colors"
              >
                <Plus size={13} />
                Capture
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Floating trigger button ──────────────────────────────────────────────────

export function QuickCaptureButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Quick capture (N)"
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-110 flex items-center justify-center"
    >
      <Plus size={22} />
    </button>
  );
}
