import React, { useState, useEffect, Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import './styles.css';

// Lazy loading de páginas para code-splitting agressivo
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Agenda = lazy(() => import('./pages/Agenda').then(m => ({ default: m.Agenda })));
const Clientes = lazy(() => import('./pages/Clientes').then(m => ({ default: m.Clientes })));
const Servicos = lazy(() => import('./pages/Servicos').then(m => ({ default: m.Servicos })));
const Caixa = lazy(() => import('./pages/Caixa').then(m => ({ default: m.Caixa })));
const Estoque = lazy(() => import('./pages/Estoque').then(m => ({ default: m.Estoque })));
const Configuracoes = lazy(() => import('./pages/Configuracoes').then(m => ({ default: m.Configuracoes })));
const PublicSchedule = lazy(() => import('./pages/PublicSchedule').then(m => ({ default: m.PublicSchedule })));
const ConfirmarAgendamento = lazy(() => import('./pages/ConfirmarAgendamento').then(m => ({ default: m.ConfirmarAgendamento })));
const AvaliacaoPublica = lazy(() => import('./pages/AvaliacaoPublica').then(m => ({ default: m.AvaliacaoPublica })));
const Avaliacoes = lazy(() => import('./pages/Avaliacoes').then(m => ({ default: m.Avaliacoes })));

// Skeleton loader elegante para transições ultra-fluidas
function PageSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-pulse">
      <div className="h-20 w-full bg-slate-200/70 dark:bg-slate-800/60 rounded-3xl backdrop-blur-md" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-40 bg-slate-200/70 dark:bg-slate-800/60 rounded-3xl" />
        <div className="h-40 bg-slate-200/70 dark:bg-slate-800/60 rounded-3xl" />
        <div className="h-40 bg-slate-200/70 dark:bg-slate-800/60 rounded-3xl" />
      </div>
      <div className="h-60 w-full bg-slate-200/70 dark:bg-slate-800/60 rounded-3xl" />
    </div>
  );
}

function MainApp() {
  const { user, loading } = useAuth();
  useTheme();
  const [activeTab, setActiveTab] = useState('agenda');
  const [publicSlug, setPublicSlug] = useState(null);
  const [isConfirmPage, setIsConfirmPage] = useState(false);
  const [publicEvaluation, setPublicEvaluation] = useState(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const path = window.location.pathname;

    const evaluationMatch = path.match(/^\/avaliar\/([^/]+)\/([^/]+)\/?$/);
    if (evaluationMatch) {
      setPublicEvaluation({ slug: evaluationMatch[1], appointmentId: evaluationMatch[2] });
      return;
    }

    // Rota de confirmação de agendamento (aberta pelo Service Worker)
    if (path === '/confirmar-agendamento') {
      setIsConfirmPage(true);
      return;
    }

    const parts = hostname.split('.');
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    const isSubdomainOfAcionar = hostname.endsWith('.acionar.online') && parts.length > 2 && parts[0] !== 'www';

    if (isSubdomainOfAcionar && !isLocalhost) {
      setPublicSlug(parts[0]);
    } else if (path.startsWith('/agendar/')) {
      const slug = path.split('/agendar/')[1]?.split('/')[0];
      if (slug) setPublicSlug(slug);
    }
  }, []);

  // Preload das páginas secundárias em idle
  useEffect(() => {
    if (user && !publicSlug && !isConfirmPage && !publicEvaluation) {
      const timer = setTimeout(() => {
        import('./pages/Clientes');
        import('./pages/Servicos');
        import('./pages/Caixa');
        import('./pages/Configuracoes');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, publicSlug, isConfirmPage, publicEvaluation]);

  // Register PWA Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
    }
  }, []);

  // 0. Confirmation page (opened by Service Worker notification click)
  if (isConfirmPage) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <ConfirmarAgendamento />
      </Suspense>
    );
  }

  if (publicEvaluation) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <AvaliacaoPublica slug={publicEvaluation.slug} appointmentId={publicEvaluation.appointmentId} />
      </Suspense>
    );
  }

  // 1. Client-facing Public Schedule Page (/agendar/:slug)
  if (publicSlug) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <PublicSchedule slug={publicSlug} />
      </Suspense>
    );
  }

  // 2. Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center text-xs font-bold">
        Carregando Acionar...
      </div>
    );
  }

  // 3. Unauthenticated state -> Login
  if (!user) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <Login />
      </Suspense>
    );
  }

  // 4. Authenticated Management App
  return (
    <div className="app-shell flex flex-col min-h-screen w-full max-w-full overflow-x-hidden text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 w-full max-w-full overflow-x-hidden pb-28 md:pb-12">
        <Suspense fallback={<PageSkeleton />}>
          {activeTab === 'agenda' && <Agenda />}
          {activeTab === 'clientes' && <Clientes />}
          {activeTab === 'servicos' && <Servicos setActiveTab={setActiveTab} />}
          {activeTab === 'estoque' && <Estoque />}
          {activeTab === 'caixa' && <Caixa />}
          {activeTab === 'avaliacoes' && <Avaliacoes />}
          {activeTab === 'configuracoes' && <Configuracoes />}
        </Suspense>
      </main>

      {/* Footer Idêntico à Produção */}
      <footer className="w-full border-t border-slate-300/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#020617]/85 py-4 text-center text-[11.5px] font-bold text-slate-600 dark:text-slate-400 backdrop-blur-md hidden md:block transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400">
        © 2026 Acionar - Sistema de Agendamentos Inteligente.
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
