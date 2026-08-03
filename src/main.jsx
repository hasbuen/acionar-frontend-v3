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

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/agendar/')) {
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
        Carregando Acionar v3...
      </div>
    );
  }

  // 3. Unauthenticated state -> Login
  if (!user) {
    return <Login />;
  }

  // 4. Authenticated Management App
  return (
    <div className="flex flex-col min-h-screen bg-[#dde6f1] dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 pb-28 md:pb-12">
        {activeTab === 'agenda' && <Agenda />}
        {activeTab === 'clientes' && <Clientes />}
        {activeTab === 'servicos' && <Servicos setActiveTab={setActiveTab} />}
        {activeTab === 'estoque' && <Estoque />}
        {activeTab === 'caixa' && <Caixa />}
        {activeTab === 'configuracoes' && <Configuracoes />}
      </main>

      {/* Footer Idêntico à Produção */}
      <footer className="w-full border-t border-slate-300/60 dark:border-slate-800/80 bg-[#eef3f8]/80 dark:bg-[#020617]/80 py-4 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 backdrop-blur-md hidden md:block">
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
