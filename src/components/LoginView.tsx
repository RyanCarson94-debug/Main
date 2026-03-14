import { useState } from 'react';
import { Lock, Eye, EyeOff, Zap } from 'lucide-react';

const PIN_KEY = 'adhd-leader-pin';

interface LoginViewProps {
  onLogin: () => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'enter' | 'create' | 'confirm'>(
    () => localStorage.getItem(PIN_KEY) ? 'enter' : 'create',
  );

  const handleSubmit = () => {
    setError('');
    const stored = localStorage.getItem(PIN_KEY);

    if (!stored) {
      if (step === 'create') {
        if (pin.length < 4) {
          setError('At least 4 characters required');
          return;
        }
        setStep('confirm');
        return;
      }
      if (step === 'confirm') {
        if (pin !== confirmPin) {
          setError("PINs don't match");
          setConfirmPin('');
          return;
        }
        localStorage.setItem(PIN_KEY, btoa(pin));
        sessionStorage.setItem('adhd-leader-session', '1');
        onLogin();
        return;
      }
    } else {
      if (btoa(pin) === stored) {
        sessionStorage.setItem('adhd-leader-session', '1');
        onLogin();
      } else {
        setError('Incorrect PIN');
        setPin('');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#12111A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br bg-violet-600 mb-4 shadow-lg">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">LEAD</h1>
          <p className="text-gray-500 text-sm mt-1">ADHD Mode</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-[#1A1824] border border-[#2A2640] p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Lock size={14} className="text-purple-400" />
            <h2 className="text-sm font-black text-white">
              {step === 'enter'
                ? 'Enter your PIN'
                : step === 'create'
                ? 'Create a PIN'
                : 'Confirm your PIN'}
            </h2>
          </div>
          <p className="text-xs text-gray-600 mb-5">
            {step === 'enter'
              ? 'Enter your PIN to access your workspace'
              : step === 'create'
              ? 'Choose a PIN to secure your workspace'
              : 'Re-enter your PIN to confirm'}
          </p>

          <div className="space-y-3">
            {step !== 'confirm' ? (
              <div className="relative">
                <input
                  autoFocus
                  type={showPin ? 'text' : 'password'}
                  placeholder="••••••"
                  value={pin}
                  onChange={e => {
                    setPin(e.target.value);
                    setError('');
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full px-4 py-3 rounded-xl bg-[#1E1C28] border border-[#2A2640] text-white text-lg tracking-widest placeholder-gray-700 focus:outline-none focus:border-purple-500/50 pr-12"
                />
                <button
                  onClick={() => setShowPin(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  autoFocus
                  type={showPin ? 'text' : 'password'}
                  placeholder="••••••"
                  value={confirmPin}
                  onChange={e => {
                    setConfirmPin(e.target.value);
                    setError('');
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full px-4 py-3 rounded-xl bg-[#1E1C28] border border-[#2A2640] text-white text-lg tracking-widest placeholder-gray-700 focus:outline-none focus:border-purple-500/50 pr-12"
                />
                <button
                  onClick={() => setShowPin(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            )}

            {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all hover:shadow-lg hover:shadow-purple-500/20"
            >
              {step === 'enter' ? 'Unlock' : step === 'create' ? 'Continue' : 'Create PIN'}
            </button>

            {step === 'confirm' && (
              <button
                onClick={() => {
                  setStep('create');
                  setConfirmPin('');
                  setError('');
                }}
                className="w-full py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-400 transition-colors"
              >
                ← Back
              </button>
            )}
          </div>
        </div>

        {step === 'enter' && (
          <p className="text-center text-[11px] text-gray-700 mt-4">
            Forgot your PIN? Clear browser data to reset.
          </p>
        )}
      </div>
    </div>
  );
}
