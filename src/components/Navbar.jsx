import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  Calendar, Users, Scissors, Boxes, DollarSign, Clock,
  Bell, LogOut, HelpCircle, Moon, Sun, Globe, X,
  ChevronDown, Plus, Activity,
  Cog,
  User,
  Star
} from 'lucide-react';
import { ModalAlert, useModalAlert } from './ModalAlert';
import { HelpCenterModal } from './HelpCenterModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiRequest } from '../services/api';

const NAV_ITEMS = [
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'servicos', label: 'Serviços', icon: Scissors },
  { id: 'estoque', label: 'Estoque', icon: Boxes },
  { id: 'caixa', label: 'Caixa', icon: DollarSign },
  { id: 'avaliacoes', label: 'Avaliações', icon: Star },
  { id: 'configuracoes', label: 'Ajustes', icon: Cog },
];

export function Navbar({ activeTab, setActiveTab }) {
  const { user, tenant, logout, socket } = useAuth();
  const { isDark } = useTheme();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('acionar.online');
  const publicUrl = isProduction && tenant?.slug
    ? `https://${tenant.slug}.acionar.online`
    : `/agendar/${tenant?.slug || ''}`;
  const { alertState, showAlert, closeAlert } = useModalAlert();

  const [notificacoes, setNotificacoes] = useState([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const prevNotificationsRef = useRef([]);

  const loadNotificacoes = async () => {
    if (!user) return;
    try {
      const res = await apiRequest('/notifications');
      const novas = res.notifications || [];

      // Se houver histórico anterior e uma nova não lida, emite o alerta sonoro
      const prev = prevNotificationsRef.current;
      if (prev && prev.length > 0) {
        const hasNewUnread = novas.some(n => !n.lida && !prev.some(p => p.id === n.id));
        if (hasNewUnread) {
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
          } catch (e) {
            console.warn('Erro ao reproduzir som de notificação:', e);
          }
        }
      }

      prevNotificationsRef.current = novas;
      setNotificacoes(novas);
    } catch (err) {
      console.warn('Erro ao buscar notificações do banco:', err);
    }
  };

  useEffect(() => {
    loadNotificacoes();

    if (socket) {
      const handleNotificationsChanged = (data) => {
        console.log('[SOCKET] Notifications changed event received:', data);
        loadNotificacoes();
      };
      socket.on('notifications-changed', handleNotificationsChanged);

      return () => {
        socket.off('notifications-changed', handleNotificationsChanged);
      };
    }
  }, [user, socket]);

  useEffect(() => {
    if (!user) return;
    // Polling redundante a cada 30 segundos como fallback
    const interval = setInterval(() => {
      loadNotificacoes();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const hasUnread = notificacoes.some(n => !n.lida);

  const handleOpenDropdown = () => {
    setShowNotificationsDropdown(!showNotificationsDropdown);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await apiRequest(`/notifications/${id}/read`, 'PUT');
      setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
      // Sincroniza o ref
      prevNotificationsRef.current = prevNotificationsRef.current.map(n => n.id === id ? { ...n, lida: true } : n);
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await apiRequest('/notifications', 'DELETE');
      setNotificacoes([]);
      prevNotificationsRef.current = [];
      setShowNotificationsDropdown(false);
    } catch (err) {
      console.error('Erro ao limpar notificações:', err);
    }
  };

  const handleLogout = () => {
    showAlert({
      type: 'warning',
      title: 'Sair da conta',
      message: 'Deseja realmente sair da sua conta?',
      confirmLabel: 'Sim, sair',
      cancelLabel: 'Cancelar',
      onConfirm: () => {
        logout();
      },
    });
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
            <img
              key={isDark ? 'brand-dark' : 'brand-light'}
              src={isDark ? "/acionar-simbolo-fundo-escuro.png?v=5" : "/acionar-logo-transparente.png?v=5"}
              alt="Logo Acionar"
              className="h-10 w-10 object-contain shadow-lg shadow-blue-500/10"
            />
            <div className="flex flex-col justify-center">
              <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
                { User && user?.nome ? user.nome.charAt(0).toUpperCase() + user.nome.slice(1) : 'Usuário' }
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1.5 rounded-2xl bg-slate-100/80 p-1.5 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-inner">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition-all duration-300 ease-out ${activeTab === id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-[0_0_20px_rgba(59,130,246,0.55)] scale-[1.03] border border-blue-400/30'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 hover:scale-[1.01]'
                  }`}
              >
                <Icon id={`nav-icon-desktop-${id}`} className={`h-4 w-4 transition-all ${activeTab === id ? 'stroke-[2.5px] text-white' : 'stroke-2'}`} />
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

              <div className="relative font-sans">
                <button
                  aria-label="Notificações"
                  onClick={handleOpenDropdown}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <Bell className="h-5 w-5" />
                  {hasUnread && (
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white dark:border-slate-950 animate-pulse"></span>
                  )}
                </button>

                {showNotificationsDropdown && (
                  <div className="fixed inset-x-4 top-16 sm:absolute sm:right-0 sm:left-auto sm:top-12 sm:w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800 mb-3">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Notificações</span>
                      {notificacoes.length > 0 && (
                        <button onClick={handleClearAll} className="text-[10px] font-extrabold text-rose-500 hover:text-rose-600 transition-colors uppercase">
                          Limpar
                        </button>
                      )}
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1 no-scrollbar overscroll-contain [-webkit-overflow-scrolling:touch]">
                      {notificacoes.length === 0 ? (
                        <div className="py-8 text-center text-xs font-semibold text-slate-400">
                          Sem novas notificações.
                        </div>
                      ) : (
                        notificacoes.map(n => {
                          const formattedTime = new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div
                              key={n.id}
                              onClick={() => !n.lida && handleMarkAsRead(n.id)}
                              className={`flex flex-col gap-0.5 rounded-xl p-2.5 border transition-all cursor-pointer ${
                                n.lida 
                                  ? 'bg-slate-50/20 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800 opacity-60' 
                                  : 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-100 dark:border-blue-900/50 hover:bg-blue-500/10 dark:hover:bg-blue-500/20'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                  {n.titulo}
                                </span>
                                {!n.lida && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                )}
                              </div>
                              <span className="text-[11.5px] font-bold leading-normal text-slate-700 dark:text-slate-200 mt-0.5">
                                {n.mensagem}
                              </span>
                              <span className="text-[9px] font-extrabold text-slate-400 text-right mt-1">
                                {formattedTime}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

              <button
                onClick={handleLogout}
                title="Sair da Conta"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm hover:shadow-rose-500/10 dark:hover:shadow-rose-500/20"
              >
                <LogOut className="h-4.5 w-4.5 stroke-[2.5px]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <ModalAlert {...alertState} onClose={closeAlert} />

      {/* Help Center & Audit Modal */}
      <HelpCenterModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        showAlert={showAlert}
      />

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t border-slate-200/80 dark:border-blue-500/30 backdrop-blur-2xl pb-safe-bottom dark:bg-slate-950/95 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_-8px_30px_rgba(59,130,246,0.2)] transition-colors duration-300">
        <div className="flex h-16 items-center gap-0.5 px-1 justify-between w-full overflow-x-auto no-scrollbar scroll-x-touch">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className="flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 py-1 px-0.5 transition-all group relative"
              >
                <div id={`nav-icon-mobile-${id}`} className={`flex h-7.5 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_16px_rgba(37,99,235,0.55)] dark:shadow-[0_0_20px_rgba(59,130,246,0.65)] scale-105 border border-blue-400/40'
                    : 'text-slate-500 group-hover:bg-slate-100 dark:text-slate-400 dark:group-hover:bg-slate-800/40'
                  }`}>
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'stroke-[2.5px] scale-110 text-white' : 'stroke-2'}`} />
                </div>
                <span className={`text-[9.5px] sm:text-[10px] tracking-tight truncate max-w-full transition-all font-black ${isActive ? 'text-blue-600 dark:text-blue-400 scale-105 drop-shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                  {label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-0.5 h-1 w-4 rounded-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.9)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
