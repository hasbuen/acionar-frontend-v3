import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Users, DollarSign, Package, Settings, LogOut, Globe } from 'lucide-react';

export function Navbar({ activeTab, setActiveTab }) {
  const { tenant, logout } = useAuth();

  const publicUrl = `/agendar/${tenant?.slug || ''}`;

  return (
    <nav className="navbar">
      <div className="nav-content">
        <div className="brand-logo">
          {tenant?.foto_url ? (
            <img src={tenant.foto_url} alt={tenant.nome_empresa} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: tenant?.cor_primaria || '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
              {(tenant?.nome_empresa || 'A')[0].toUpperCase()}
            </div>
          )}
          <span>{tenant?.nome_empresa || 'Acionar v3'}</span>
        </div>

        <div className="nav-tabs">
          <button className={`nav-tab ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => setActiveTab('agenda')}>
            <Calendar size={16} /> Agenda
          </button>
          <button className={`nav-tab ${activeTab === 'clientes' ? 'active' : ''}`} onClick={() => setActiveTab('clientes')}>
            <Users size={16} /> Clientes
          </button>
          <button className={`nav-tab ${activeTab === 'caixa' ? 'active' : ''}`} onClick={() => setActiveTab('caixa')}>
            <DollarSign size={16} /> Caixa
          </button>
          <button className={`nav-tab ${activeTab === 'estoque' ? 'active' : ''}`} onClick={() => setActiveTab('estoque')}>
            <Package size={16} /> Estoque
          </button>
          <button className={`nav-tab ${activeTab === 'configuracoes' ? 'active' : ''}`} onClick={() => setActiveTab('configuracoes')}>
            <Settings size={16} /> Agenda Pública & Cores
          </button>
          <a href={publicUrl} target="_blank" rel="noreferrer" className="nav-tab" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#f59e0b' }}>
            <Globe size={16} /> Ver Agenda Pública
          </a>
          <button className="nav-tab" onClick={logout} title="Sair">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
