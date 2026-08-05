import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Settings, Users, Bell, Globe, Palette, Copy, Check, Clock, MessageSquare, MapPin, ShieldAlert, Plus, Trash2, Upload, Image as ImageIcon, CreditCard } from 'lucide-react';
import { ModalAlert, useModalAlert } from '../components/ModalAlert';

export function Configuracoes() {
  const { tenant, setTenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [savingPayments, setSavingPayments] = useState(false);
  const [payments, setPayments] = useState({ asaas_enabled: false, asaas_environment: 'sandbox', pix_key: '', pix_key_type: 'aleatoria', asaas_api_key: '', asaas_api_key_configured: false });
  const fileInputRef = useRef(null);
  const { alertState, showAlert, closeAlert } = useModalAlert();

  // Operating Hours (Segunda a Domingo)
  const [horarios, setHorarios] = useState([
    { dia: 'Segunda-feira', inicio: '08:00', fim: '18:00', ativo: true },
    { dia: 'Terça-feira', inicio: '08:00', fim: '18:00', ativo: true },
    { dia: 'Quarta-feira', inicio: '08:00', fim: '18:00', ativo: true },
    { dia: 'Quinta-feira', inicio: '08:00', fim: '18:00', ativo: true },
    { dia: 'Sexta-feira', inicio: '08:00', fim: '19:00', ativo: true },
    { dia: 'Sábado', inicio: '08:00', fim: '17:00', ativo: true },
    { dia: 'Domingo', inicio: '09:00', fim: '12:00', ativo: false },
  ]);

  // Bloqueios / Férias
  const [bloqueios, setBloqueios] = useState([
    { id: 1, inicio: '2026-12-24', fim: '2026-12-25', motivo: 'Recesso de Natal' }
  ]);
  const [novoBloqueio, setNovoBloqueio] = useState({ inicio: '', fim: '', motivo: '' });

  // WhatsApp & Endereço
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    'Olá {cliente_nome}, confirmamos seu agendamento para {data_hora} ({servico_nome}) no endereço: {endereco}.'
  );
  const [endereco, setEndereco] = useState('Rua da amizade 515 bairro: 14 de novembro');

  // Branding & Public Schedule
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

  useEffect(() => {
    apiRequest('/config/payments').then(res => setPayments(prev => ({ ...prev, ...res.settings }))).catch(() => {});
  }, []);

  const publicLink = `${window.location.origin}/agendar/${form.novo_slug || tenant?.slug || ''}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Intuitive Logo File Upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert({ type: 'warning', title: 'Arquivo inválido', message: 'Por favor selecione um arquivo de imagem válido.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setUploadingLogo(true);
      try {
        const res = await apiRequest('/config/upload-logo', 'POST', { imageBase64: base64 });
        setForm(prev => ({ ...prev, foto_url: res.foto_url }));
        setTenant({ ...tenant, foto_url: res.foto_url });
        setMessage('Foto do logotipo carregada e atualizada com sucesso!');
      } catch (err) {
        showAlert({ type: 'error', message: err.message || 'Erro ao carregar imagem do logotipo.' });
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
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
      showAlert({ type: 'error', message: err.message || 'Erro ao salvar configurações.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayments = async (e) => {
    e.preventDefault();
    setSavingPayments(true);
    try {
      const res = await apiRequest('/config/payments', 'PUT', payments);
      setPayments(prev => ({ ...prev, ...res.settings, asaas_api_key: '' }));
      setMessage('Configuração Pix e Asaas salva com sucesso!');
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao salvar configuração de pagamentos.' });
    } finally {
      setSavingPayments(false);
    }
  };

  const handleAddBloqueio = (e) => {
    e.preventDefault();
    if (!novoBloqueio.inicio || !novoBloqueio.fim) return;
    setBloqueios([...bloqueios, { ...novoBloqueio, id: Date.now() }]);
    setNovoBloqueio({ inicio: '', fim: '', motivo: '' });
  };

  const handleRemoveBloqueio = (id) => {
    setBloqueios(bloqueios.filter(b => b.id !== id));
  };

  const selectClass = "w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-blue-500";
  const inputClass = "w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-blue-500 placeholder:text-slate-400";
  const cardClass = "rounded-3xl border border-slate-200 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/60 p-6 shadow-xl space-y-4 backdrop-blur-xl transition-all duration-300";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <ModalAlert {...alertState} onClose={closeAlert} />

      {/* Header Banner */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400">PARÂMETROS</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Configurações Gerais</h1>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-black text-emerald-600 dark:text-emerald-400 animate-fade-in">
          {message}
        </div>
      )}

      {/* Organização em Grid com 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* COLUNA DA ESQUERDA: Informações Básicas, Logotipo, Cores e Links */}
        <div className="space-y-6">
          
          {/* Card: Resumo Rápido */}
          <div className={cardClass}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-sm">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Resumo rápido da operação</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Visão geral do branding e agenda pública.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-950/70">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Empresa</p>
                <h4 className="mt-1 text-sm font-black text-slate-900 dark:text-white truncate">{tenant?.nome_empresa || 'Sua empresa'}</h4>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-950/70">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Agenda pública</p>
                <h4 className="mt-1 text-sm font-black text-slate-900 dark:text-white">{form.agenda_publica_ativa ? 'Ativa' : 'Desativada'}</h4>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-950/70">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Slug ativo</p>
                <h4 className="mt-1 truncate text-sm font-black text-blue-600 dark:text-blue-400">{tenant?.slug || 'Padrão'}</h4>
              </div>
            </div>
          </div>

          {/* Card: Logotipo da Empresa */}
          <div className={cardClass}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-sm">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Foto do Logotipo da Empresa</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Carregue a marca que seus clientes verão na agenda.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
              <div className="h-24 w-24 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 dark:bg-slate-950 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {form.foto_url ? (
                  <img src={form.foto_url} alt="Logotipo" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-slate-400 dark:text-slate-600" />
                )}
              </div>

              <div className="space-y-3 w-full sm:w-auto flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="btn-animated inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-teal-500/20 w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingLogo ? 'Enviando imagem...' : 'Escolher Foto / Logotipo'}
                </button>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">Formatos aceitos: PNG, JPG, JPEG, WEBP. Armazenado na VPS.</p>
              </div>
            </div>
          </div>

          {/* Card: Agenda Pública & Personalização */}
          <form onSubmit={handleSave} className="space-y-6">
            <div className={cardClass}>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-500 dark:text-blue-400" /> Agenda Pública Online
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Permita que seus clientes agendem horários sozinhos.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agenda_publica_ativa}
                    onChange={(e) => setForm({ ...form, agenda_publica_ativa: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Subdomínio / Slug da Agenda</label>
                  <input
                    type="text"
                    value={form.novo_slug}
                    onChange={(e) => setForm({ ...form, novo_slug: e.target.value })}
                    placeholder="patriciabeato"
                    required
                    className={inputClass}
                  />
                </div>

                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/70 p-3.5 flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-mono text-blue-600 dark:text-amber-400 truncate select-all">{publicLink}</span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 shrink-0 transition"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copiado!' : 'Copiar Link'}
                  </button>
                </div>
              </div>

              {/* Personalização de Marca & Cores */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Palette className="h-4.5 w-4.5 text-blue-500" /> Personalização de Marca & Cores
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Cor Primária</label>
                    <input
                      type="color"
                      value={form.cor_primaria}
                      onChange={(e) => setForm({ ...form, cor_primaria: e.target.value })}
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer p-0.5 bg-white dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Cor Destaque</label>
                    <input
                      type="color"
                      value={form.cor_destaque}
                      onChange={(e) => setForm({ ...form, cor_destaque: e.target.value })}
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer p-0.5 bg-white dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Cor Fundo</label>
                    <input
                      type="color"
                      value={form.cor_fundo}
                      onChange={(e) => setForm({ ...form, cor_fundo: e.target.value })}
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer p-0.5 bg-white dark:bg-slate-950"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-animated py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-black text-white shadow-lg shadow-blue-500/20"
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações de Cores e Marca'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* COLUNA DA DIREITA: Financeiro, Horários, Alertas, WhatsApp */}
        <div className="space-y-6">
          
          {/* Card: Pix e Asaas */}
          <form onSubmit={handleSavePayments} className={cardClass}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-sm">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Pix e Asaas</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receba agendamentos online automaticamente.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Ambiente</label>
                <select value={payments.asaas_environment} onChange={e => setPayments({ ...payments, asaas_environment: e.target.value })} className={selectClass}>
                  <option value="sandbox">Sandbox (Testes)</option>
                  <option value="production">Produção (Real)</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 w-full px-4 py-3.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input type="checkbox" checked={payments.asaas_enabled} onChange={e => setPayments({ ...payments, asaas_enabled: e.target.checked })} className="h-4.5 w-4.5 accent-emerald-500 rounded" />
                  Ativar cobrança pelo Asaas
                </label>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Tipo da chave Pix</label>
                <select value={payments.pix_key_type} onChange={e => setPayments({ ...payments, pix_key_type: e.target.value })} className={selectClass}>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="telefone">Telefone</option>
                  <option value="aleatoria">Chave aleatória</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Chave Pix</label>
                <input value={payments.pix_key} onChange={e => setPayments({ ...payments, pix_key: e.target.value })} className={inputClass} placeholder="Chave para receber o Pix" />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Token privado Asaas {payments.asaas_api_key_configured && <span className="normal-case text-emerald-600 dark:text-emerald-400 font-extrabold">(Configurado ✔)</span>}
                <input type="password" value={payments.asaas_api_key} onChange={e => setPayments({ ...payments, asaas_api_key: e.target.value })} className={`${inputClass} mt-1.5`} placeholder="Deixe em branco para manter o configurado" autoComplete="new-password" />
              </label>
              <button type="submit" disabled={savingPayments} className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20 transition hover:opacity-95">{savingPayments ? 'Salvando...' : 'Salvar Pix e Asaas'}</button>
            </div>
          </form>

          {/* Card: Alerta Pop-up */}
          <div className={cardClass}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-sm">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Alerta de Atendimento Próximo</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Toque sinal sonoro antes do início de cada atendimento.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <select className={selectClass}>
                <option value="5">5 Minutos antes (Padrão)</option>
                <option value="10">10 Minutos antes</option>
                <option value="15">15 Minutos antes</option>
                <option value="20">20 Minutos antes</option>
                <option value="30">30 Minutos antes</option>
                <option value="60">1 Hora antes</option>
              </select>
              <button className="w-full sm:w-auto shrink-0 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-slate-950 transition">
                ✓ Salvar Alerta
              </button>
            </div>
          </div>

          {/* Card: Horários de Funcionamento */}
          <div className={cardClass}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-sm">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Horários de Funcionamento</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Expediente padrão para reservas na agenda.</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {horarios.map((h, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input
                      type="checkbox"
                      checked={h.ativo}
                      onChange={(e) => {
                        const next = [...horarios];
                        next[idx].ativo = e.target.checked;
                        setHorarios(next);
                      }}
                      className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-extrabold text-slate-800 dark:text-white min-w-[100px]">{h.dia}</span>
                  </div>

                  {h.ativo ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={h.inicio}
                        onChange={(e) => {
                          const next = [...horarios];
                          next[idx].inicio = e.target.value;
                          setHorarios(next);
                        }}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white"
                      />
                      <span className="text-slate-400 font-medium">até</span>
                      <input
                        type="time"
                        value={h.fim}
                        onChange={(e) => {
                          const next = [...horarios];
                          next[idx].fim = e.target.value;
                          setHorarios(next);
                        }}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white"
                      />
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-wider">Fechado</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card: Bloqueios / Férias */}
          <div className={cardClass}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shadow-sm">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Bloqueios de Horários / Folgas</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bloqueie agendamentos em datas festivas ou folgas.</p>
              </div>
            </div>

            <form onSubmit={handleAddBloqueio} className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <input
                type="date"
                value={novoBloqueio.inicio}
                onChange={(e) => setNovoBloqueio({ ...novoBloqueio, inicio: e.target.value })}
                required
                className={`${inputClass} px-3`}
              />
              <input
                type="date"
                value={novoBloqueio.fim}
                onChange={(e) => setNovoBloqueio({ ...novoBloqueio, fim: e.target.value })}
                required
                className={`${inputClass} px-3`}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novoBloqueio.motivo}
                  onChange={(e) => setNovoBloqueio({ ...novoBloqueio, motivo: e.target.value })}
                  placeholder="Motivo"
                  className={`${inputClass} px-3 flex-1`}
                />
                <button type="submit" className="px-4 py-3 rounded-2xl bg-rose-600 text-xs font-black text-white hover:bg-rose-500 transition shadow-md shadow-rose-500/15">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </form>

            <div className="space-y-2 pt-2 max-h-[200px] overflow-y-auto pr-1 no-scrollbar">
              {bloqueios.map((b) => (
                <div key={b.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 p-3.5 text-xs flex justify-between items-center">
                  <div>
                    <strong className="text-slate-800 dark:text-white block font-bold">{b.motivo || 'Bloqueio'}</strong>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold mt-0.5 block">{b.inicio} até {b.fim}</span>
                  </div>
                  <button onClick={() => handleRemoveBloqueio(b.id)} className="text-rose-500 hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-xl transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card: WhatsApp & Endereço */}
          <div className={cardClass}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-sm">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Mensagem no WhatsApp & Endereço</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mensagens automáticas de confirmação de agendamentos.</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Endereço do Estabelecimento</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Modelo de Mensagem no WhatsApp</label>
                <textarea
                  rows="3"
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value)}
                  className={`${inputClass} resize-none h-24 p-4`}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
