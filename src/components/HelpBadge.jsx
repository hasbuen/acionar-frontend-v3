import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export function HelpBadge({ title = 'Como funciona?', description, badgeText = 'Ajuda' }) {
  const [open, setOpen] = useState(false);

  if (!description) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold transition-all hover:scale-105 active:scale-95 shrink-0"
        title="Clique para entender como funciona"
      >
        <HelpCircle className="h-3 w-3" />
        <span>{badgeText}</span>
      </button>

      {open && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
              {description}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition-colors shadow-md"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
