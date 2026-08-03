import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Settings, Globe, Palette, Copy, Check, Image, Power } from 'lucide-react';

export function Configuracoes() {
  const { tenant, setTenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    agenda_publica_ativa: true,
    foto_url: '',
    cor_primaria: '#0d9488',
    cor_destaque: '#f59e0b',
    cor_fundo: '#0f172a',
    novo_slug: '',
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        agenda_publica_ativa: tenant.agenda_publica_ativa ?? true,
        foto_url: tenant.foto_url || '',
        cor_primaria: tenant.cor_primaria || '#0d9488',
        cor_destaque: tenant.cor_destaque || '#f59e0b',
        cor_fundo: tenant.cor_fundo || '#0f172a',
        novo_slug: tenant.slug || '',
      });
    }
  }, [tenant]);

  const publicLink = `${window.location.origin}/agendar/${form.novo_slug || tenant?.slug || ''}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await apiRequest('/config/public-schedule', 'PUT', form);
      setTenant({ ...tenant, ...res.settings });
      if (res.settings.slug !== tenant.slug) {
        localStorage.setItem('acionar_v3_slug', res.settings.slug);
      }
      setMessage('Configurações e personalização salvas com sucesso!');
    } catch (err) {
      alert(err.message || 'Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Personalização & Agenda Pública</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Configure as regras da agenda pública para clientes, foto da marca e paleta de cores CSS
        </p>
      </div>

      {message && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Toggle Status Agenda */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Power size={18} color={form.agenda_publica_ativa ? 'var(--success)' : 'var(--danger)'} />
                Status da Agenda Pública Online
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Quando desativada, os clientes visualizarão mensagem informando que o agendamento online está fechado.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.agenda_publica_ativa}
                onChange={(e) => setForm({ ...form, agenda_publica_ativa: e.target.checked })}
                style={{ width: 24, height: 24, accentColor: 'var(--primary-color)' }}
              />
            </label>
          </div>
        </div>

        {/* Link e Subdomínio */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={18} color="var(--primary-color)" /> Link e Subdomínio da Agenda
          </h3>

          <div className="form-group">
            <label>Subdomínio / Identificador Único (Slug)</label>
            <input
              className="form-input"
              value={form.novo_slug}
              onChange={(e) => setForm({ ...form, novo_slug: e.target.value })}
              placeholder="ex: patriciabeato"
              required
            />
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <span style={{ fontSize: 14, color: 'var(--accent-color)', fontFamily: 'monospace' }}>{publicLink}</span>
            <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={handleCopyLink}>
              {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />} {copied ? 'Copiado!' : 'Copiar Link'}
            </button>
          </div>
        </div>

        {/* Foto e Cores */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Palette size={18} color="var(--primary-color)" /> Identidade Visual e Paleta de Cores
          </h3>

          <div className="form-group">
            <label>URL da Foto / Logotipo da Marca</label>
            <input
              className="form-input"
              value={form.foto_url}
              onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
              placeholder="https://sua-foto.com/logo.jpg"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginTop: 16 }}>
            <div className="form-group">
              <label>Cor Primária</label>
              <input
                type="color"
                value={form.cor_primaria}
                onChange={(e) => setForm({ ...form, cor_primaria: e.target.value })}
                style={{ width: '100%', height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
              />
            </div>

            <div className="form-group">
              <label>Cor de Destaque</label>
              <input
                type="color"
                value={form.cor_destaque}
                onChange={(e) => setForm({ ...form, cor_destaque: e.target.value })}
                style={{ width: '100%', height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
              />
            </div>

            <div className="form-group">
              <label>Cor de Fundo (Página)</label>
              <input
                type="color"
                value={form.cor_fundo}
                onChange={(e) => setForm({ ...form, cor_fundo: e.target.value })}
                style={{ width: '100%', height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Live Preview */}
          <div style={{ marginTop: 20, padding: 16, borderRadius: 12, backgroundColor: form.cor_fundo, border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>PREVIEW DA PÁGINA PÚBLICA</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: form.cor_primaria, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                {(tenant?.nome_empresa || 'A')[0]}
              </div>
              <div>
                <strong style={{ color: '#fff', fontSize: 16 }}>{tenant?.nome_empresa || 'Sua Empresa'}</strong>
                <div style={{ fontSize: 12, color: form.cor_destaque }}>Agendamento Online Ativo</div>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: 16 }} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Alterações de Estilo & Agenda'}
        </button>
      </form>
    </div>
  );
}
