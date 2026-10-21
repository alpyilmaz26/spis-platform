import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, Loader2, X } from 'lucide-react';
import { UiTheme } from '../types';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'loading';
  duration?: number;
}

interface ToastNotificationProps {
  toast: ToastMessage | null;
  onClose: () => void;
  uiTheme: UiTheme;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose, uiTheme }) => {
  useEffect(() => {
    if (!toast || toast.type === 'loading') return;

    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 3500);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isLight = uiTheme === 'light';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-fadeIn">
      <div
        className={`p-3.5 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-xl ${
          toast.type === 'success'
            ? isLight
              ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
            : toast.type === 'error'
            ? isLight
              ? 'bg-rose-50/95 border-rose-300 text-rose-950'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-100'
            : toast.type === 'loading'
            ? isLight
              ? 'bg-blue-50/95 border-blue-300 text-blue-950'
              : 'bg-blue-950/90 border-blue-500/40 text-blue-100'
            : isLight
            ? 'bg-white/95 border-slate-300 text-slate-900'
            : 'bg-[#0C0C0E]/95 border-zinc-800 text-zinc-100'
        }`}
      >
        <div className="shrink-0">
          {toast.type === 'loading' ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          ) : toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-500" />
          ) : (
            <Info className="w-5 h-5 text-blue-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-snug">{toast.message}</p>
        </div>

        {toast.type !== 'loading' && (
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isLight ? 'hover:bg-slate-200/80 text-slate-500' : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
