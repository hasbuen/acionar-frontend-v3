import React, { useState, useEffect } from 'react';
import { X, BookOpen, Headphones, ShieldCheck, Clock } from 'lucide-react';

export function HelpCenterModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Mock or fetch audit operations history
      setHistory([
        { id: 1, acao: 'Agendamento Criado', entidade: 'agendamentos', data: new Date().toLocaleTimeString() },
        { id: 2, acao: 'Login Efetuado', entidade: 'auth', data: new Date(Date.now() - 3600000).toLocaleTimeString() }
      ]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md max-h-[88dvh] overflow-y-auto rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-scale-in space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
              Central de ajuda
            </span>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Como podemos ajudar?
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options */}
        <div className="grid gap-3">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-slate-800 dark:bg-slate-950/50">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
              <BookOpen className="h-5 w-5" />
            </span>
            <span>
              <strong className="block text-sm font-extrabold text-slate-900 dark:text-white">
                Acesso a FAQs e Dúvidas
              </strong>
              <small className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                Encontre respostas rápidas para usar melhor o Acionar.
              </small>
            </span>
          </div>

          <a
            href="https://wa.me/5511999998888?text=Olá,%20preciso%20de%20suporte%20no%20Acionar"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-slate-800 dark:bg-slate-950/50 hover:border-violet-500/50 transition"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-600">
              <Headphones className="h-5 w-5" />
            </span>
            <span>
              <strong className="block text-sm font-extrabold text-slate-900 dark:text-white">
                Suporte WhatsApp
              </strong>
              <small className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                Fale com o time quando precisar de acompanhamento.
              </small>
            </span>
          </a>
        </div>

        {/* User Operations History Section */}
        <section className="border-t border-slate-200 pt-5 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Minhas operações</h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Histórico privado deste usuário.</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-600">
              Privado
            </span>
          </div>

          <div className="space-y-2">
            {history.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.acao}</strong>
                  <time className="text-[10px] text-slate-400">{item.data}</time>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Módulo: {item.entidade}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
