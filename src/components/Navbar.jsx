import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Users, Scissors, DollarSign, Clock, Bell, HelpCircle, Sun, LogOut, Globe } from 'lucide-react';

export function Navbar({ activeTab, setActiveTab }) {
  const { user, tenant, logout } = useAuth();

  const publicUrl = `/agendar/${tenant?.slug || ''}`;

  return (
    <>
      {/* Header Principal Superior */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-300/80 bg-[#eef3f8]/95 pt-safe-top backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/80 dark:bg-[#020617]/80">
        <div className="px-4 sm:px-6 py-3 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              {(tenant?.nome_empresa || 'P')[0].toUpperCase()}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Acionar v3</span>
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> AO VIVO
                </span>
              </div>
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                {user?.nome || tenant?.nome_empresa || 'Patricia'}
              </span>
            </div>
          </div>

          {/* Desktop Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 rounded-2xl bg-slate-200/60 p-1.5 dark:bg-slate-900/80 border border-slate-300/50 dark:border-slate-800/80">
            <button
              onClick={() => setActiveTab('agenda')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                activeTab === 'agenda'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Calendar className="h-4 w-4" /> Agenda
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                activeTab === 'clientes'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" /> Clientes
            </button>
            <button
              onClick={() => setActiveTab('servicos')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                activeTab === 'servicos'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Scissors className="h-4 w-4" /> Serviços
            </button>
            <button
              onClick={() => setActiveTab('caixa')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                activeTab === 'caixa'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <DollarSign className="h-4 w-4" /> Caixa
            </button>
            <button
              onClick={() => setActiveTab('configuracoes')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                activeTab === 'configuracoes'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Clock className="h-4 w-4" /> Horários & Agenda
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
            >
              <Globe className="h-3.5 w-3.5" /> Agenda Pública
            </a>
            <span className="hidden xl:block text-xs font-semibold text-slate-400 max-w-[140px] truncate">
              {user?.email || tenant?.email_proprietario}
            </span>
            <button className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 shadow-sm">
              <Bell className="h-4 w-4" />
            </button>
            <button onClick={logout} title="Sair" className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-500 shadow-sm">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar (Mobile / Fixed) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#020617]/95 border-t border-slate-800 backdrop-blur-xl px-2 py-2 pb-safe-bottom">
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'agenda' ? 'bg-blue-600/20 text-blue-400 font-extrabold' : 'text-slate-400 font-medium'
            }`}
          >
            <Calendar className="h-5 w-5 mb-0.5" />
            <span className="text-[10px]">Agenda</span>
          </button>

          <button
            onClick={() => setActiveTab('clientes')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'clientes' ? 'bg-blue-600/20 text-blue-400 font-extrabold' : 'text-slate-400 font-medium'
            }`}
          >
            <Users className="h-5 w-5 mb-0.5" />
            <span className="text-[10px]">Clientes</span>
          </button>

          <button
            onClick={() => setActiveTab('servicos')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'servicos' ? 'bg-blue-600/20 text-blue-400 font-extrabold' : 'text-slate-400 font-medium'
            }`}
          >
            <Scissors className="h-5 w-5 mb-0.5" />
            <span className="text-[10px]">Serviços</span>
          </button>

          <button
            onClick={() => setActiveTab('caixa')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'caixa' ? 'bg-blue-600/20 text-blue-400 font-extrabold' : 'text-slate-400 font-medium'
            }`}
          >
            <DollarSign className="h-5 w-5 mb-0.5" />
            <span className="text-[10px]">Caixa</span>
          </button>

          <button
            onClick={() => setActiveTab('configuracoes')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'configuracoes' ? 'bg-blue-600/20 text-blue-400 font-extrabold' : 'text-slate-400 font-medium'
            }`}
          >
            <Clock className="h-5 w-5 mb-0.5" />
            <span className="text-[10px]">Horários</span>
          </button>
        </div>
      </div>
    </>
  );
}
