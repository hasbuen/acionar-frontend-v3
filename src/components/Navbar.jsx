import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import {
  Calendar, Users, Scissors, Boxes, DollarSign, Clock,
  Bell, LogOut, HelpCircle, Moon, Sun, Globe, X,
  ChevronDown, Plus, Activity,
  Cog
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'servicos', label: 'Serviços', icon: Scissors },
  { id: 'estoque', label: 'Estoque', icon: Boxes },
  { id: 'caixa', label: 'Caixa', icon: DollarSign },
  { id: 'configuracoes', label: 'Ajustes', icon: Cog },
];

export function Navbar({ activeTab, setActiveTab }) {
  const user = { nome: 'Patricia' };
  const tenant = { nome_empresa: 'Acionar Online', slug: 'acionar-online' };
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const publicUrl = `/agendar/${tenant?.slug || ''}`;

  useEffect(() => {
    const saved = localStorage.getItem('color-theme') || 'light';
    setDark(saved === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('color-theme', next ? 'dark' : 'light');
  };

  const handleTabChange = (id) => {
    setActiveTab(id);
    
    // Animar ícone do desktop
    gsap.fromTo(`#nav-icon-desktop-${id}`,
      { scale: 0.75, rotate: -8 },
      { scale: 1.15, rotate: 0, duration: 0.45, ease: 'elastic.out(1.2, 0.4)', overwrite: 'auto' }
    );
    
    // Animar ícone do mobile
    gsap.fromTo(`#nav-icon-mobile-${id}`,
      { scale: 0.82, y: 3 },
      { scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.8)', overwrite: 'auto' }
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 pt-safe-top backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/80 dark:bg-slate-950/85 shadow-sm">
        <div className="px-4 sm:px-6 py-3 max-w-7xl mx-auto flex items-center justify-between">

          <div className="flex items-center gap-3">
            <img src={dark ? "/logo-tema-escuro.png" : "/logo-tema-claro.png"} alt="Logo Acionar" className="h-10 w-10 object-contain rounded-xl shadow-lg shadow-blue-500/10" />
            <div className="flex flex-col justify-center">
              <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
                {user?.nome || tenant?.nome_empresa}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-slate-100/70 p-1.5 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-300 ease-out ${activeTab === id
                    ? 'bg-white text-blue-600 shadow-md dark:bg-slate-800 dark:text-blue-400 scale-[1.03] shadow-blue-500/10 dark:shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200 hover:scale-[1.01]'
                  }`}
              >
                <Icon id={`nav-icon-desktop-${id}`} className={`h-4 w-4 transition-all ${activeTab === id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 xl:flex transition-colors"
            >
              <Globe className="h-4 w-4" /> Agenda Pública
            </a>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHelpModal(true)}
                title="Central de Ajuda"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400"
              >
                <HelpCircle className="h-5 w-5" />
              </button>

              <button
                aria-label="Notificações"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 border-2 border-white dark:border-slate-950"></span>
              </button>

              <button
                aria-label="Alternar Tema"
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 hover:text-amber-500 dark:hover:bg-slate-800 dark:hover:text-amber-400 active:scale-95"
              >
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

              <button
                onClick={() => alert('Logout clicado')}
                title="Sair"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-600 dark:text-rose-400 transition-all hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Central de Ajuda</h2>
              <button onClick={() => setShowHelpModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Aqui estão as instruções de uso do sistema.</p>
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t border-slate-200/80 dark:border-blue-500/20 backdrop-blur-2xl pb-safe-bottom dark:bg-slate-950/95 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgba(59,130,246,0.12)] transition-colors duration-300">
        <div className="flex h-16 items-center justify-around px-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className="flex w-16 flex-col items-center justify-center gap-1 py-1 transition-all group"
              >
                <div id={`nav-icon-mobile-${id}`} className={`flex h-8 w-14 items-center justify-center rounded-full transition-all duration-300 ${isActive
                    ? 'bg-blue-100/90 text-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.2)] dark:bg-blue-900/50 dark:text-blue-400 dark:shadow-[0_0_18px_rgba(59,130,246,0.45)] scale-105'
                    : 'text-slate-500 group-hover:bg-slate-100 dark:text-slate-400 dark:group-hover:bg-slate-800/40'
                  }`}>
                  <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-2'}`} />
                </div>
                <span className={`text-[10px] tracking-wide transition-all font-black ${isActive ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}