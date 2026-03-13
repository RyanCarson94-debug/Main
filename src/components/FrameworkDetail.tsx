import { X, CheckCircle, XCircle, Zap, Clock, Link2 } from 'lucide-react';
import type { Framework } from '../frameworks-data';
import { FRAMEWORKS } from '../frameworks-data';
import { CATEGORY_COLORS } from './FrameworkCard';

interface FrameworkDetailProps {
  framework: Framework;
  onClose: () => void;
  onNavigate: (framework: Framework) => void;
}

export function FrameworkDetail({ framework, onClose, onNavigate }: FrameworkDetailProps) {
  const color = CATEGORY_COLORS[framework.category] ?? { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };

  const relatedFrameworks = framework.related
    .map(id => FRAMEWORKS.find(f => f.id === id))
    .filter(Boolean) as Framework[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#141417] border border-[#2C2C30] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-6 pb-4 bg-[#141417] border-b border-[#2C2C30]">
          <div className="flex-1 min-w-0">
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 ${color.bg} ${color.text} border ${color.border}`}>
              {framework.category}
            </div>
            <h2 className="text-xl font-black text-white leading-tight">{framework.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{framework.origin}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <p className="text-sm text-gray-300 leading-relaxed">{framework.description}</p>

          {/* When to Use */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={13} className="text-purple-400" />
              <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">When to Use</p>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{framework.whenToUse}</p>
          </div>

          {/* Key Components */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Key Components</p>
            <ul className="space-y-2">
              {framework.keyComponents.map((component, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-black flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-300 leading-relaxed">{component}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2.5">Strengths</p>
              <ul className="space-y-1.5">
                {framework.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle size={13} className="shrink-0 text-emerald-400 mt-0.5" />
                    <span className="text-xs text-gray-400 leading-relaxed">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2.5">Limitations</p>
              <ul className="space-y-1.5">
                {framework.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <XCircle size={13} className="shrink-0 text-red-400 mt-0.5" />
                    <span className="text-xs text-gray-400 leading-relaxed">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ADHD Tip */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={13} className="text-amber-400" />
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">ADHD Tip</p>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{framework.adhdTip}</p>
          </div>

          {/* Related Frameworks */}
          {relatedFrameworks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Link2 size={13} className="text-gray-500" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Related Frameworks</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedFrameworks.map(related => {
                  const relColor = CATEGORY_COLORS[related.category] ?? { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
                  return (
                    <button
                      key={related.id}
                      onClick={() => onNavigate(related)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-125 ${relColor.bg} ${relColor.text} border ${relColor.border}`}
                    >
                      {related.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
