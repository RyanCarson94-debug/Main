import { X } from 'lucide-react';

interface Props { onClose: () => void; }

const SHORTCUTS = [
  { group: 'Navigation', items: [
    { keys: ['N'], label: 'Quick capture / brain dump' },
    { keys: ['⌘', 'K'], label: 'Search everything' },
    { keys: ['/'], label: 'Search (alternative)' },
    { keys: ['?'], label: 'Show this keyboard shortcut map' },
    { keys: ['Esc'], label: 'Close any overlay' },
  ]},
  { group: 'Tasks', items: [
    { keys: ['Click card'], label: 'Edit task' },
    { keys: ['Hover → ✓'], label: 'Move task to next stage' },
    { keys: ['Drag'], label: 'Reorder in Kanban or Eisenhower' },
  ]},
  { group: 'Brain Dump', items: [
    { keys: ['⌘', 'Enter'], label: 'Capture items' },
    { keys: ['Shift', 'Enter'], label: 'New line while typing' },
  ]},
  { group: 'General', items: [
    { keys: ['⌘', 'K'], label: 'Open search from anywhere' },
  ]},
];

export function KeyboardShortcutsModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1A1824] border border-[#2A2640] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2640]">
          <div>
            <h2 className="text-base font-bold text-white">Keyboard Shortcuts</h2>
            <p className="text-xs text-gray-500 mt-0.5">Press <kbd className="px-1 py-0.5 rounded bg-white/[0.07] border border-[#2A2640] text-gray-400 text-[10px]">?</kbd> anytime to show this</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {SHORTCUTS.map(group => (
            <div key={group.group}>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">{group.group}</p>
              <div className="space-y-1.5">
                {group.items.map(item => (
                  <div key={item.label} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-400">{item.label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, i) => (
                        <kbd
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-white/[0.07] border border-[#2A2640] text-gray-300 text-[11px] font-mono"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
