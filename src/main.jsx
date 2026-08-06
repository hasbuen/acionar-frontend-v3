import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Agenda } from './pages/Agenda';
import { Clientes } from './pages/Clientes';
import { Servicos } from './pages/Servicos';
import { Caixa } from './pages/Caixa';
import { Estoque } from './pages/Estoque';
import { Configuracoes } from './pages/Configuracoes';
import { PublicSchedule } from './pages/PublicSchedule';
import './styles.css';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('agenda');
  const [publicSlug, setPublicSlug] = useState(null);

  // 0. Sincronizar o Tema com o localStorage logo no carregamento inicial
  useEffect(() => {
    const savedTheme = localStorage.getItem('color-theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const hostname = window.location.hostname;
    const path = window.location.pathname;

    const parts = hostname.split('.');
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    const isMainDomain = hostname === 'acionar.online' || hostname === 'www.acionar.online';

    if (parts.length > 2 && parts[0] !== 'www' && !isLocalhost && !isMainDomain) {
      // Subdomain routing (e.g. patriciabeato.acionar.online)
      setPublicSlug(parts[0]);
    } else if (path.startsWith('/agendar/')) {
      // Path-based routing fallback (e.g. localhost:3000/agendar/patriciabeato)
      const slug = path.split('/agendar/')[1]?.split('/')[0];
      if (slug) setPublicSlug(slug);
    }
  }, []);

  // Register PWA Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
    }
  }, []);

  // 1. Client-facing Public Schedule Page (/agendar/:slug)
  if (publicSlug) {
    return <PublicSchedule slug={publicSlug} />;
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
    return <Login />;
  }

  // 4. Authenticated Management App
  return (
    <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden bg-gradient-to-tr from-slate-50 via-[#f0f4f9] to-[#e5eef7] dark:from-[#020617] dark:via-[#090f23] dark:to-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 w-full max-w-full overflow-x-hidden pb-28 md:pb-12">
        {activeTab === 'agenda' && <Agenda />}
        {activeTab === 'clientes' && <Clientes />}
        {activeTab === 'servicos' && <Servicos setActiveTab={setActiveTab} />}
        {activeTab === 'estoque' && <Estoque />}
        {activeTab === 'caixa' && <Caixa />}
        {activeTab === 'configuracoes' && <Configuracoes />}
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
      <MainApp />
    </AuthProvider>
  </React.StrictMode>
);
