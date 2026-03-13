import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Delete',
  danger = true,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#0C0820] border border-[#2D1F5E] p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          {danger && <AlertTriangle size={18} className="text-red-400 shrink-0" />}
          <h3 className="text-base font-black text-white">{title}</h3>
        </div>
        <p className="text-sm text-gray-400 mb-5">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-white hover:bg-white/5 transition-colors border border-white/5"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              danger
                ? 'bg-red-600/80 hover:bg-red-600 text-white'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
