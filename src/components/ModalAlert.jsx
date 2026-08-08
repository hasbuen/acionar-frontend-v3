import React, { useEffect, useRef } from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

/**
 * ModalAlert — substituição do alert() nativo com suporte a rastreamento por tipo.
 *
 * Props:
 *  - open       {boolean}  — controla visibilidade
 *  - onClose    {Function} — callback ao fechar
 *  - type       {string}   — 'info' | 'error' | 'warning'  (padrão: 'info')
 *  - title      {string}   — título do modal (opcional, gerado automaticamente pelo tipo se omitido)
 *  - message    {string}   — mensagem principal (obrigatório)
 *  - onConfirm  {Function} — se fornecido, exibe botão "Confirmar" além de "Fechar" (útil para substituir confirm())
 *  - confirmLabel {string} — rótulo do botão de confirmação (padrão: 'Confirmar')
 *  - cancelLabel  {string} — rótulo do botão de cancelamento (padrão: 'Fechar')
 */

const TYPE_CONFIG = {
  info: {
    icon: Info,
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/15',
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/20 dark:border-blue-500/30',
    titleColor: 'text-blue-600 dark:text-blue-400',
    btnClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20 dark:shadow-blue-500/30',
    defaultTitle: 'Informação',
    glowClass: 'shadow-blue-500/5 dark:shadow-blue-500/10',
  },
  error: {
    icon: XCircle,
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/15',
    iconColor: 'text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-500/20 dark:border-rose-500/30',
    titleColor: 'text-rose-600 dark:text-rose-400',
    btnClass: 'bg-gradient-to-r from-rose-600 to-red-600 shadow-rose-500/20 dark:shadow-rose-500/30',
    defaultTitle: 'Erro',
    glowClass: 'shadow-rose-500/5 dark:shadow-rose-500/10',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    iconColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/20 dark:border-amber-500/30',
    titleColor: 'text-amber-600 dark:text-amber-400',
    btnClass: 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/20 dark:shadow-amber-500/30',
    defaultTitle: 'Atenção',
    glowClass: 'shadow-amber-500/5 dark:shadow-amber-500/10',
  },
  success: {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500/20 dark:border-emerald-500/30',
    titleColor: 'text-emerald-600 dark:text-emerald-400',
    btnClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/20 dark:shadow-emerald-500/30',
    defaultTitle: 'Sucesso',
    glowClass: 'shadow-emerald-500/5 dark:shadow-emerald-500/10',
  },
};

export function ModalAlert({
  open,
  onClose,
  type = 'info',
  title,
  message,
  onConfirm,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Fechar',
}) {
  const closeBtnRef = useRef(null);
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const Icon = config.icon;
  const resolvedTitle = title || config.defaultTitle;

  // Focar o botão principal ao abrir (acessibilidade)
  useEffect(() => {
    if (open) {
      setTimeout(() => closeBtnRef.current?.focus(), 60);
    }
  }, [open]);

  // Fechar com ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-alert-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`
          relative w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-[2rem] border bg-white dark:bg-slate-900 p-6 shadow-2xl
          ${config.borderColor} ${config.glowClass}
          animate-scale-in
        `}
      >
        {/* Close button — top-right */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon + Title */}
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${config.iconBg}`}>
            <Icon className={`h-7 w-7 ${config.iconColor}`} strokeWidth={2.2} />
          </div>
          <h2
            id="modal-alert-title"
            className={`text-lg font-black tracking-tight ${config.titleColor}`}
          >
            {resolvedTitle}
          </h2>
        </div>

        {/* Message */}
        <p className="text-center text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className={`flex gap-3 ${onConfirm ? 'flex-col sm:flex-row' : 'justify-center'}`}>
          {onConfirm && (
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white px-5 py-3.5 min-h-[44px] text-xs font-black transition-all"
            >
              {cancelLabel}
            </button>
          )}
          <button
            ref={closeBtnRef}
            onClick={onConfirm ? onConfirm : onClose}
            className={`
              flex-1 rounded-2xl px-5 py-3.5 min-h-[44px] text-xs font-black text-white shadow-lg
              transition-all hover:opacity-95 hover:scale-[1.02] active:scale-95
              ${config.btnClass}
            `}
          >
            {onConfirm ? confirmLabel : cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * useModalAlert — hook utilitário para abrir ModalAlert de forma imperativa.
 */
export function useModalAlert() {
  const [alertState, setAlertState] = React.useState({
    open: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    confirmLabel: 'Confirmar',
    cancelLabel: 'Fechar',
  });

  const showAlert = React.useCallback((opts = {}) => {
    setAlertState({
      open: true,
      type: opts.type || 'info',
      title: opts.title || '',
      message: opts.message || '',
      onConfirm: opts.onConfirm || null,
      confirmLabel: opts.confirmLabel || 'Confirmar',
      cancelLabel: opts.cancelLabel || (opts.onConfirm ? 'Cancelar' : 'Fechar'),
    });
  }, []);

  const closeAlert = React.useCallback(() => {
    setAlertState((prev) => ({ ...prev, open: false, onConfirm: null }));
  }, []);

  return { alertState, showAlert, closeAlert };
}
