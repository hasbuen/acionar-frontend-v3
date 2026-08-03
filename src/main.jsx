import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Agenda } from './pages/Agenda';
import { Clientes } from './pages/Clientes';
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
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={{ flex: 1, paddingBottom: 40 }}>
        {activeTab === 'agenda' && <Agenda />}
        {activeTab === 'clientes' && <Clientes />}
        {activeTab === 'caixa' && <Caixa />}
        {activeTab === 'estoque' && <Estoque />}
        {activeTab === 'configuracoes' && <Configuracoes />}
      </main>
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
