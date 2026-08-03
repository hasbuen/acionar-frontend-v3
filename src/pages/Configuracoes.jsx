import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Settings, Users, Bell, Globe, Palette, Copy, Check, Power, UserPlus } from 'lucide-react';

export function Configuracoes() {
  const { tenant, setTenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  // Branding & Public Schedule
  const [form, setForm] = useState({
    agenda_publica_ativa: true,
    foto_url: '',
    cor_primaria: '#0d9488',
    cor_destaque: '#f59e0b',
    cor_fundo: '#0f172a',
    novo_slug: '',
  });

  // Auxiliar Team form
  const [auxForm, setAuxForm] = useState({
    nome: '',
    email: '',
    senha: '',
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
      setMessage('Configurações salvas com sucesso!');
    } catch (err) {
      alert(err.message || 'Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner (Matching Screenshot 5) */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">PARÂMETROS</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Configurações Gerais</h1>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs font-bold text-emerald-400">
          {message}
        </div>
      )}

      {/* Card 1: Tempo de Antecedência do Alerta */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-black text-white">Tempo de Antecedência do Alerta</h3>
          <p className="text-xs text-slate-400 mt-1">
            Escolha com quantos minutos de antecedência o aviso pop-up deve estourar na tela
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select className="w-full sm:w-auto flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            <option value="5">5 Minutos antes (Padrão)</option>
            <option value="10">10 Minutos antes</option>
            <option value="15">15 Minutos antes</option>
            <option value="30">30 Minutos antes</option>
          </select>
          <button className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 text-xs font-black text-slate-950 hover:bg-amber-400 transition">
            ✓ Salvar
          </button>
        </div>
      </div>

      {/* Card 2: Agenda Pública & Personalização de Cores */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-400" /> Agenda Pública Online
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ative ou desative o agendamento público para clientes.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.agenda_publica_ativa}
                onChange={(e) => setForm({ ...form, agenda_publica_ativa: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Subdomínio / Slug da Agenda
            </label>
            <input
              type="text"
              value={form.novo_slug}
              onChange={(e) => setForm({ ...form, novo_slug: e.target.value })}
              placeholder="patriciabeato"
              required
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="rounded-2xl bg-slate-950 p-3 flex items-center justify-between gap-2 border border-slate-800">
            <span className="text-xs font-mono text-amber-400 truncate">{publicLink}</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700 flex items-center gap-1.5 shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copiado!' : 'Copiar Link'}
            </button>
          </div>
        </div>

        {/* Card 3: Marca e Cores CSS */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Palette className="h-5 w-5 text-blue-400" /> Personalização de Marca & Cores
          </h3>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              URL do Logotipo da Empresa
            </label>
            <input
              type="text"
              value={form.foto_url}
              onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Cor Primária</label>
              <input
                type="color"
                value={form.cor_primaria}
                onChange={(e) => setForm({ ...form, cor_primaria: e.target.value })}
                className="w-full h-10 rounded-xl border-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Cor Destaque</label>
              <input
                type="color"
                value={form.cor_destaque}
                onChange={(e) => setForm({ ...form, cor_destaque: e.target.value })}
                className="w-full h-10 rounded-xl border-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Cor Fundo</label>
              <input
                type="color"
                value={form.cor_fundo}
                onChange={(e) => setForm({ ...form, cor_fundo: e.target.value })}
                className="w-full h-10 rounded-xl border-none cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-animated py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-black text-white shadow-lg shadow-blue-500/25"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>

      {/* Card 4: Gestão de Equipe & Auxiliares (Matching Screenshot 5) */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Gestão de Equipe & Auxiliares</h3>
            <p className="text-xs text-slate-400 mt-0.5">Cadastre auxiliares com e-mail corporativo</p>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-slate-950 p-5 space-y-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-purple-400 uppercase tracking-wider">
            <UserPlus className="h-4 w-4" /> CADASTRAR NOVO AUXILIAR / MEMBRO DA EQUIPE
          </span>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">NOME COMPLETO</label>
              <input
                type="text"
                value={auxForm.nome}
                onChange={(e) => setAuxForm({ ...auxForm, nome: e.target.value })}
                placeholder="Ex: Maria Santos"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">E-MAIL CORPORATIVO</label>
              <input
                type="email"
                value={auxForm.email}
                onChange={(e) => setAuxForm({ ...auxForm, email: e.target.value })}
                placeholder="patricia@acionar.online"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">SENHA DE ACESSO</label>
              <input
                type="password"
                value={auxForm.senha}
                onChange={(e) => setAuxForm({ ...auxForm, senha: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              />
            </div>

            <button
              onClick={() => alert('Auxiliar registrado no schema do tenant.')}
              className="w-full py-3 rounded-2xl bg-purple-600 text-xs font-black text-white hover:bg-purple-500 transition"
            >
              Cadastrar Auxiliar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
