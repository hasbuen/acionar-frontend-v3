import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Settings, Users, Bell, Globe, Palette, Copy, Check, Clock, MessageSquare, MapPin, ShieldAlert, Plus, Trash2, Upload, Image as ImageIcon, CreditCard } from 'lucide-react';

export function Configuracoes() {
  const { tenant, setTenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [savingPayments, setSavingPayments] = useState(false);
  const [payments, setPayments] = useState({ asaas_enabled: false, asaas_environment: 'sandbox', pix_key: '', pix_key_type: 'aleatoria', asaas_api_key: '', asaas_api_key_configured: false });
  const fileInputRef = useRef(null);

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
      alert('Por favor selecione um arquivo de imagem válido.');
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
        alert(err.message || 'Erro ao carregar imagem do logotipo.');
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
      alert(err.message || 'Erro ao salvar configurações.');
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
      alert(err.message || 'Erro ao salvar configuração de pagamentos.');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
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

      {/* Card 1: Logotipo / Foto com Upload Intuitivo */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Foto do Logotipo da Empresa</h3>
            <p className="text-xs text-slate-400">Carregue a imagem da sua marca diretamente do seu dispositivo</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
          <div className="h-24 w-24 rounded-3xl bg-slate-950 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
            {form.foto_url ? (
              <img src={form.foto_url} alt="Logotipo" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-8 w-8 text-slate-600" />
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
              className="btn-animated inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3.5 text-xs font-black text-white shadow-lg shadow-teal-500/25 w-full sm:w-auto"
            >
              <Upload className="h-4 w-4" />
              {uploadingLogo ? 'Enviando imagem...' : 'Clique para Escolher Foto / Logotipo'}
            </button>
            <p className="text-[11px] text-slate-500">Formatos aceitos: PNG, JPG, JPEG, WEBP. Armazenamento automático no servidor VPS.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSavePayments} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><CreditCard className="h-5 w-5" /></div>
          <div><h3 className="text-base font-black text-white">Pix e Asaas</h3><p className="text-xs text-slate-400">Configure a chave Pix e a integração de pagamentos online.</p></div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Ambiente<select value={payments.asaas_environment} onChange={e => setPayments({ ...payments, asaas_environment: e.target.value })} className="mt-1 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white"><option value="sandbox">Sandbox</option><option value="production">Produção</option></select></label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-bold text-white"><input type="checkbox" checked={payments.asaas_enabled} onChange={e => setPayments({ ...payments, asaas_enabled: e.target.checked })} className="h-4 w-4 accent-emerald-500" /> Ativar cobrança pelo Asaas</label>
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Tipo da chave Pix<select value={payments.pix_key_type} onChange={e => setPayments({ ...payments, pix_key_type: e.target.value })} className="mt-1 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white"><option value="cpf">CPF</option><option value="cnpj">CNPJ</option><option value="email">E-mail</option><option value="telefone">Telefone</option><option value="aleatoria">Chave aleatória</option></select></label>
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Chave Pix<input value={payments.pix_key} onChange={e => setPayments({ ...payments, pix_key: e.target.value })} className="mt-1 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white" placeholder="Informe a chave Pix" /></label>
        </div>
        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">Token privado Asaas {payments.asaas_api_key_configured && <span className="normal-case text-emerald-400">(já configurado; deixe vazio para manter)</span>}<input type="password" value={payments.asaas_api_key} onChange={e => setPayments({ ...payments, asaas_api_key: e.target.value })} className="mt-1 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white" placeholder="$aact_..." autoComplete="new-password" /></label>
        <button type="submit" disabled={savingPayments} className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20">{savingPayments ? 'Salvando...' : 'Salvar Pix e Asaas'}</button>
      </form>

      {/* Card 2: Alerta Pop-up de Atendimento Próximo */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Alerta Pop-up de Atendimento Próximo</h3>
            <p className="text-xs text-slate-400">Exibe modal na tela e toca sinal sonoro antes do início de cada atendimento</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <select className="w-full sm:w-auto flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            <option value="5">5 Minutos antes (Padrão)</option>
            <option value="10">10 Minutos antes</option>
            <option value="15">15 Minutos antes</option>
            <option value="20">20 Minutos antes</option>
            <option value="30">30 Minutos antes</option>
            <option value="60">1 Hora antes</option>
          </select>
          <button className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 text-xs font-black text-slate-950 hover:bg-amber-400 transition">
            ✓ Salvar Alerta
          </button>
        </div>
      </div>

      {/* Card 3: Horários de Funcionamento por Dia da Semana */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Horários de Funcionamento</h3>
            <p className="text-xs text-slate-400">Defina o expediente para atendimento presencial e online</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {horarios.map((h, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="checkbox"
                  checked={h.ativo}
                  onChange={(e) => {
                    const next = [...horarios];
                    next[idx].ativo = e.target.checked;
                    setHorarios(next);
                  }}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500"
                />
                <span className="font-extrabold text-white min-w-[110px]">{h.dia}</span>
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
                    className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
                  />
                  <span className="text-slate-400">até</span>
                  <input
                    type="time"
                    value={h.fim}
                    onChange={(e) => {
                      const next = [...horarios];
                      next[idx].fim = e.target.value;
                      setHorarios(next);
                    }}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
                  />
                </div>
              ) : (
                <span className="text-xs font-extrabold text-rose-400 uppercase">Fechado</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card 4: Bloqueios de Horários / Folgas / Férias */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Bloqueios de Horários / Folgas / Férias</h3>
            <p className="text-xs text-slate-400">Impeça agendamentos em datas específicas de folga</p>
          </div>
        </div>

        <form onSubmit={handleAddBloqueio} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="date"
            value={novoBloqueio.inicio}
            onChange={(e) => setNovoBloqueio({ ...novoBloqueio, inicio: e.target.value })}
            required
            className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-bold text-white"
          />
          <input
            type="date"
            value={novoBloqueio.fim}
            onChange={(e) => setNovoBloqueio({ ...novoBloqueio, fim: e.target.value })}
            required
            className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-bold text-white"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={novoBloqueio.motivo}
              onChange={(e) => setNovoBloqueio({ ...novoBloqueio, motivo: e.target.value })}
              placeholder="Motivo (ex: Recesso)"
              className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-bold text-white"
            />
            <button type="submit" className="px-4 py-3 rounded-2xl bg-rose-600 text-xs font-black text-white hover:bg-rose-500">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="space-y-2 pt-2">
          {bloqueios.map((b) => (
            <div key={b.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs flex justify-between items-center">
              <div>
                <strong className="text-white block">{b.motivo || 'Bloqueio'}</strong>
                <span className="text-slate-400 text-[11px]">{b.inicio} até {b.fim}</span>
              </div>
              <button onClick={() => handleRemoveBloqueio(b.id)} className="text-rose-400 hover:text-rose-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Card 5: Mensagem no WhatsApp & Endereço */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Mensagem no WhatsApp & Endereço</h3>
            <p className="text-xs text-slate-400">Personalize o texto enviado ao aceitar e confirmar agendamentos</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Endereço do Estabelecimento</label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-bold text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Modelo de Mensagem no WhatsApp</label>
            <textarea
              rows="3"
              value={whatsappTemplate}
              onChange={(e) => setWhatsappTemplate(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs font-bold text-white resize-none"
            />
          </div>
        </div>
      </div>

      {/* Card 6: Agenda Pública & Personalização de Cores */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-400" /> Agenda Pública Online
              </h3>
              <p className="text-xs text-slate-400 mt-1">Ative ou desative o agendamento público para clientes.</p>
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
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Subdomínio / Slug da Agenda</label>
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

        {/* Card 7: Marca e Cores CSS */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Palette className="h-5 w-5 text-blue-400" /> Personalização de Marca & Cores
          </h3>

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
            {loading ? 'Salvando...' : 'Salvar Alterações de Cores e Marca'}
          </button>
        </div>
      </form>
    </div>
  );
}
