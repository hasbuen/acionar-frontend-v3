import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, Scissors, Boxes, DollarSign, Clock, 
  Bell, LogOut, HelpCircle, Moon, Sun, Globe, X, 
  ChevronDown, Plus, Activity 
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'servicos', label: 'Serviços', icon: Scissors },
  { id: 'estoque', label: 'Estoque', icon: Boxes },
  { id: 'caixa', label: 'Caixa', icon: DollarSign },
  { id: 'configuracoes', label: 'Horários', icon: Clock },
];

export function Navbar({ activeTab, setActiveTab }) {
  const user = { nome: 'Patricia' };
  const tenant = { nome_empresa: 'Acionar Online', slug: 'acionar-online' };
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const publicUrl = `/agendar/${tenant?.slug || ''}`;

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('color-theme', next ? 'dark' : 'light');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 pt-safe-top backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/80 dark:bg-slate-950/85 shadow-sm">
        <div className="px-4 sm:px-6 py-3 max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-lg font-bold text-white shadow-lg shadow-blue-500/20">
              {(tenant?.nome_empresa || 'P')[0].toUpperCase()}
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Acionar Online
              </span>
              <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
                {user?.nome || tenant?.nome_empresa || 'Patricia'}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-slate-100/70 p-1.5 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ease-out ${
                  activeTab === id
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400 scale-[1.02]'
                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 transition-all ${activeTab === id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
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
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
              >
                <HelpCircle className="h-5 w-5" />
              </button>

              <button 
                aria-label="Notificações" 
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 border-2 border-white dark:border-slate-950"></span>
              </button>

              <button 
                aria-label="Alternar Tema" 
                onClick={toggleTheme} 
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-amber-400 active:scale-95"
              >
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

              <button 
                onClick={() => alert('Logout clicado')} 
                title="Sair" 
                className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-500/80 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 border-t border-slate-200 backdrop-blur-xl pb-safe-bottom dark:bg-slate-950/90 dark:border-slate-800">
        <div className="flex h-16 items-center justify-around px-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex w-16 flex-col items-center justify-center gap-1 py-1 transition-all group"
              >
                <div className={`flex h-8 w-14 items-center justify-center rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' 
                    : 'text-slate-500 group-hover:bg-slate-100 dark:text-slate-400 dark:group-hover:bg-slate-800'
                }`}>
                  <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-2'}`} />
                </div>
                <span className={`text-[10px] tracking-wide transition-all ${
                  isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'
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

const IndicadoresAccordion = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-200 dark:bg-[#0f172a] dark:border-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.99] ${isOpen ? 'rounded-b-none border-b-0' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Activity className="h-5 w-5 stroke-[2.5px]" />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Visão Geral
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100">
              Indicadores de Hoje
            </span>
          </div>
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-blue-100 dark:bg-blue-900/30' : ''}`}>
          <ChevronDown className={`h-5 w-5 transition-colors ${isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out bg-white dark:bg-[#0f172a] border border-t-0 border-slate-200 dark:border-slate-800 rounded-b-2xl shadow-sm ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 p-4 pt-2">
            
            <div className="flex flex-col justify-center rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-900/50">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">
                Solicitados
              </span>
              <span className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">
                0
              </span>
            </div>
            
            <div className="flex flex-col justify-center rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-900/50">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Confirmados
              </span>
              <span className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">
                0
              </span>
            </div>
            
            <div className="flex flex-col justify-center rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-900/50">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Atendidos
              </span>
              <span className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">
                1
              </span>
            </div>
            
            <div className="flex flex-col justify-center rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-900/50">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                Cancelados
              </span>
              <span className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">
                0
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('agenda');
  const ActiveItem = NAV_ITEMS.find(i => i.id === activeTab);

  useEffect(() => {
    if (!localStorage.getItem('color-theme') && !document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-300 font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12 pb-32">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="mb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-500 mb-1 block">
              Gestão Inteligente
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight capitalize">
              {ActiveItem ? ActiveItem.label : activeTab}
            </h1>
          </div>

          {activeTab === 'agenda' ? (
            <>
              <IndicadoresAccordion />

              <button className="w-full md:w-auto flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] mb-8">
                <Plus className="h-6 w-6 stroke-[2.5px]" />
                Novo Agendamento
              </button>
            </>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
              Navegue de volta para a aba "Agenda" para ver o acordeão de indicadores.
            </p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-6 shadow-sm flex flex-col justify-between">
                <div className="flex gap-4 items-center">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-1/2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <div className="h-2 w-3/4 rounded-full bg-slate-100 dark:bg-slate-800/50"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <div className="h-8 flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                   <div className="h-8 flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}