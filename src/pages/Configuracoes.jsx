import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Settings, Users, Bell, Globe, Palette, Copy, Check, Clock, MessageSquare, MapPin, ShieldAlert, Plus, Trash2, Upload, Image as ImageIcon, CreditCard } from 'lucide-react';
import { ModalAlert, useModalAlert } from '../components/ModalAlert';
import { PremiumToggle } from '../components/PremiumToggle';
import { PremiumCheckbox } from '../components/PremiumCheckbox';
import { PremiumSelect } from '../components/PremiumSelect';

export function Configuracoes() {
  const { tenant, setTenant, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [savingPayments, setSavingPayments] = useState(false);
  const [showPixForm, setShowPixForm] = useState(false);
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
  const [alarmEnabled, setAlarmEnabledState] = useState(false);
  const [alarmMinutes, setAlarmMinutes] = useState(() => parseInt(localStorage.getItem('alarm-minutes') || '10', 10));
  const [profissionaisList, setProfissionaisList] = useState([]);
  const [editingProfId, setEditingProfId] = useState(null);
  const [profForm, setProfForm] = useState({
    nome: '',
    emailPrefix: '',
    senha: '',
    cor_identificadora: '#8c52ff', // Purple as default from screen
    aceita_atendimento_externo: false
  });
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('alarm-enabled');
    if (saved === 'true') {
      setAlarmEnabledState(true);
    } else if (saved === null && 'Notification' in window && Notification.permission === 'granted') {
      setAlarmEnabledState(true);
      localStorage.setItem('alarm-enabled', 'true');
    }
  }, []);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const playTestSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const now = audioCtx.currentTime;

      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.18);
      gain2.gain.setValueAtTime(0.5, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.65);

      if ('vibrate' in navigator) {
        navigator.vibrate([250, 120, 250]);
      }
    } catch (e) {
      console.warn('Erro ao reproduzir som:', e);
    }
  };

  const toggleAlarm = async () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        if (audioCtx.state === 'suspended') audioCtx.resume();
      }
    } catch (e) { }

    const nextState = !alarmEnabled;

    if (nextState) {
      if (!('Notification' in window)) {
        showAlert({ type: 'error', message: 'Este navegador não suporta notificações.' });
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showAlert({ type: 'error', message: 'Permissão de notificação negada pelo dispositivo.' });
        return;
      }

      setAlarmEnabledState(true);
      localStorage.setItem('alarm-enabled', 'true');

      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;

          const keyRes = await apiRequest('/notifications/public-key');
          const publicKey = keyRes.publicKey;
          if (!publicKey) throw new Error('Chave pública do servidor não identificada.');

          let subscription = await registration.pushManager.getSubscription();
          if (subscription && subscription.options.applicationServerKey) {
            const current = new Uint8Array(subscription.options.applicationServerKey);
            const expected = urlBase64ToUint8Array(publicKey);
            const matches = current.length === expected.length && current.every((v, i) => v === expected[i]);
            if (!matches) {
              await subscription.unsubscribe();
              subscription = null;
            }
          }

          if (!subscription) {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicKey)
            });
          }

          const subscriptionJson = subscription.toJSON();

          await apiRequest('/notifications/subscribe', 'POST', {
            endpoint: subscription.endpoint,
            p256dh: subscriptionJson.keys?.p256dh || null,
            auth: subscriptionJson.keys?.auth || null,
            user_agent: navigator.userAgent,
            plataforma: /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : /android/i.test(navigator.userAgent) ? 'android' : 'web'
          });

          playTestSound();
          showAlert({ type: 'success', message: 'Notificações e alarme ativados com sucesso!' });
        } else {
          playTestSound();
          showAlert({ type: 'info', message: 'Alarme ativado localmente (Notificações em segundo plano não suportadas neste navegador).' });
        }
      } catch (err) {
        console.error('[PUSH SUBSCRIBE ERROR]', err);
        playTestSound();
        showAlert({ type: 'error', message: 'Alarme ativado, mas falhou ao sincronizar notificações em segundo plano: ' + (err.message || '') });
      }
    } else {
      setAlarmEnabledState(false);
      localStorage.setItem('alarm-enabled', 'false');
      showAlert({ type: 'info', message: 'Alarme sonoro desativado.' });

      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await apiRequest('/notifications/unsubscribe', 'POST', { endpoint: subscription.endpoint });
          }
        }
      } catch (err) {
        console.warn('Erro ao cancelar assinatura no servidor:', err);
      }
    }
  };

  // WhatsApp & Endereço
  const [messages, setMessages] = useState({
    endereco: 'Rua da amizade 515 bairro: 14 de novembro',
    template_confirmacao: `📍 *Endereço*: {endereco}

Por gentileza, informe se concorda com este horário ou se prefere realizar alguma alteração.

📌 *Lembrete importante*: Pedimos a gentileza de chegar com **15 minutos de antecedência**.

Agradecemos a preferência e aguardamos você!😊`,
    template_manutencao: `Olá, *{cliente}*! 👋

Passando para lembrar que sua *MANUTENÇÃO PERIÓDICA* de *{servico}* está agendada para o dia *{data}* às *{hora}*.

📍 *Endereço*: {endereco}`
  });
  const [lastFocusedField, setLastFocusedField] = useState('confirmacao');
  const textareaConfRef = useRef(null);
  const textareaManutRef = useRef(null);

  const DEFAULT_CONFIRMACAO = `📍 *Endereço*: {endereco}

Por gentileza, informe se concorda com este horário ou se prefere realizar alguma alteração.

📌 *Lembrete importante*: Pedimos a gentileza de chegar com **15 minutos de antecedência**.

Agradecemos a preferência e aguardamos você!😊`;

  const DEFAULT_MANUTENCAO = `Olá, *{cliente}*! 👋

Passando para lembrar que sua *MANUTENÇÃO PERIÓDICA* de *{servico}* está agendada para o dia *{data}* às *{hora}*.

📍 *Endereço*: {endereco}`;

  // Branding & Public Schedule
  const [form, setForm] = useState({
    agenda_publica_ativa: true,
    nome_empresa: '',
    foto_url: '',
    cor_primaria: '#0d9488',
    cor_destaque: '#f59e0b',
    cor_fundo: '#0f172a',
    cor_texto_principal: '#ffffff',
    cor_texto_secundario: '#94a3b8',
    novo_slug: '',
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        agenda_publica_ativa: tenant.agenda_publica_ativa ?? true,
        nome_empresa: tenant.nome_empresa || '',
        foto_url: tenant.foto_url || '',
        cor_primaria: tenant.cor_primaria || '#0d9488',
        cor_destaque: tenant.cor_destaque || '#f59e0b',
        cor_fundo: tenant.cor_fundo || '#0f172a',
        cor_texto_principal: tenant.cor_texto_principal || '#ffffff',
        cor_texto_secundario: tenant.cor_texto_secundario || '#94a3b8',
        novo_slug: tenant.slug || '',
      });
    }
  }, [tenant]);

  const fetchProfissionais = () => {
    apiRequest('/profissionais?all=true')
      .then(res => {
        if (res.profissionais) setProfissionaisList(res.profissionais);
      })
      .catch(() => { });
  };

  useEffect(() => {
    apiRequest('/config/payments').then(res => setPayments(prev => ({ ...prev, ...res.settings }))).catch(() => { });
    apiRequest('/config/messages').then(res => {
      if (res.settings) {
        setMessages(res.settings);
      }
    }).catch(() => { });
    fetchProfissionais();
  }, []);

  const slug = form.novo_slug || tenant?.slug || '';
  const isProduction = window.location.hostname.includes('acionar.online');
  const publicLink = isProduction 
    ? `https://${slug}.acionar.online` 
    : `${window.location.origin}/agendar/${slug}`;

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
        setLogoError(false);
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
      const isKeyFilled = Boolean(payments.pix_key?.trim());
      const payload = {
        ...payments,
        asaas_enabled: isKeyFilled,
      };
      const res = await apiRequest('/config/payments', 'PUT', payload);
      setPayments(prev => ({ ...prev, ...res.settings }));
      setShowPixForm(false);
      setMessage('Chave Pix salva com sucesso!');
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao salvar chave Pix.' });
    } finally {
      setSavingPayments(false);
    }
  };

  const handleSaveMessages = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await apiRequest('/config/messages', 'PUT', messages);
      setMessages(res.settings);
      setMessage('Configurações de mensagens salvas com sucesso!');
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao salvar configurações de mensagens.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInsertVariable = (variable) => {
    const field = lastFocusedField === 'confirmacao' ? 'template_confirmacao' : 'template_manutencao';
    const ref = lastFocusedField === 'confirmacao' ? textareaConfRef.current : textareaManutRef.current;
    if (!ref) return;

    const start = ref.selectionStart || 0;
    const end = ref.selectionEnd || 0;
    const currentText = messages[field] || '';
    const newText = currentText.substring(0, start) + variable + currentText.substring(end);

    setMessages(prev => ({
      ...prev,
      [field]: newText
    }));

    setTimeout(() => {
      ref.focus();
      ref.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const handleSaveProfissional = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const email = `${profForm.emailPrefix.trim()}@acionar.online`;
      const payload = {
        nome: profForm.nome,
        email,
        senha: profForm.senha,
        cor_identificadora: profForm.cor_identificadora,
        aceita_atendimento_externo: profForm.aceita_atendimento_externo
      };

      if (editingProfId) {
        await apiRequest(`/profissionais/${editingProfId}`, 'PUT', {
          ...payload,
          senha: profForm.senha || undefined // Send only if provided
        });
        showAlert({ type: 'success', message: 'Auxiliar atualizado com sucesso!' });
      } else {
        await apiRequest('/profissionais', 'POST', payload);
        showAlert({ type: 'success', message: 'Novo auxiliar cadastrado com sucesso!' });
      }

      setEditingProfId(null);
      setProfForm({
        nome: '',
        emailPrefix: '',
        senha: '',
        cor_identificadora: '#8c52ff',
        aceita_atendimento_externo: false
      });
      fetchProfissionais();
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao salvar auxiliar.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfissional = (p) => {
    setEditingProfId(p.id);
    const emailPrefix = p.email.replace('@acionar.online', '');
    setProfForm({
      nome: p.nome,
      emailPrefix,
      senha: '', // Keep blank unless updating
      cor_identificadora: p.cor_identificadora || '#8c52ff',
      aceita_atendimento_externo: p.aceita_atendimento_externo || false
    });
  };

  const handleDeleteProfissional = (id) => {
    // Chamamos o showAlert passando as informações E a função onConfirm
    showAlert({
      type: 'warning',
      title: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja remover este auxiliar?',
      confirmLabel: 'Sim, remover', // Você pode personalizar o texto aqui
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        // Tudo o que está AQUI DENTRO só vai rodar quando o usuário clicar em "Sim, remover"

        // Opcional: fechar o modal de confirmação antes de rodar o loading
        closeAlert();

        try {
          setLoading(true);
          await apiRequest(`/profissionais/${id}`, 'DELETE');

          // Exibe o modal de sucesso logo em seguida
          showAlert({ type: 'success', message: 'Auxiliar removido com sucesso!' });
          fetchProfissionais();

        } catch (err) {
          showAlert({ type: 'error', message: err.message || 'Erro ao remover auxiliar.' });
        } finally {
          setLoading(false);
        }
      }
    });
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


          {/* Card: Agenda Pública & Personalização */}
          {user?.cargo === 'auxiliar' ? (
            <div className={cardClass}>
              <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4 shadow-inner">
                  <Globe className="h-8 w-8" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Agenda Pública Online</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-2">
                  Apenas proprietários e administradores podem configurar ou personalizar cores e logotipo da agenda pública online.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className={cardClass}>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-500 dark:text-blue-400" /> Agenda Pública Online?
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Permita que seus clientes agendem horários sozinhos.</p>
                  </div>
                  <PremiumToggle
                    checked={form.agenda_publica_ativa}
                    onChange={(e) => setForm({ ...form, agenda_publica_ativa: e.target.checked })}
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Subdomínio da Agenda</label>
                    <input
                      type="text"
                      value={form.novo_slug}
                      onChange={(e) => setForm({ ...form, novo_slug: e.target.value })}
                      placeholder="patriciabeato"
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Nome da Agenda Acionar</label>
                    <input
                      type="text"
                      value={form.nome_empresa}
                      onChange={(e) => setForm({ ...form, nome_empresa: e.target.value })}
                      placeholder="Ex: Meu Espaço de Beleza"
                      required={form.agenda_publica_ativa}
                      disabled={!form.agenda_publica_ativa}
                      className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
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
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Cor Texto Principal</label>
                      <input
                        type="color"
                        value={form.cor_texto_principal}
                        onChange={(e) => setForm({ ...form, cor_texto_principal: e.target.value })}
                        className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer p-0.5 bg-white dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Cor Texto Secundário</label>
                      <input
                        type="color"
                        value={form.cor_texto_secundario}
                        onChange={(e) => setForm({ ...form, cor_texto_secundario: e.target.value })}
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

                {/* Card: Logotipo da Empresa */}
                <div className={cardClass}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-sm">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Foto do Logotipo</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Carregue a marca que seus clientes verão na agenda.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
                    <div className="h-24 w-24 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 dark:bg-slate-950 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {form.foto_url && !logoError ? (
                        <img
                          src={form.foto_url}
                          alt="Logotipo"
                          className="h-full w-full object-cover"
                          onError={() => setLogoError(true)}
                        />
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
              </div>
            </form>
          )}
        </div>

        {/* COLUNA DA DIREITA: Financeiro, Horários, Alertas, WhatsApp */}
        <div className="space-y-6">

          {/* Card: Meus Recebimentos (Pix) */}
          <div className={cardClass}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-sm">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Meus Recebimentos</h3>
                    <span className="text-[9px] font-black uppercase text-slate-400">OPCIONAL</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${payments.pix_key?.trim()
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                      {payments.pix_key?.trim() ? 'ATIVADO' : 'NÃO ATIVADO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cadastre sua Chave Pix para receber os atendimentos diretamente no seu banco com repasse automático.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPixForm(!showPixForm)}
                className="btn-animated inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-500/20 shrink-0 self-start sm:self-center"
              >
                <Copy className="h-3.5 w-3.5" />
                {showPixForm ? 'Fechar configurações' : 'Informe sua Chave Pix'}
              </button>
            </div>

            {/* Pix Form Toggle */}
            {showPixForm && (
              <form onSubmit={handleSavePayments} className="py-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Tipo da chave Pix</label>
                    <PremiumSelect
                      value={payments.pix_key_type}
                      onChange={e => setPayments({ ...payments, pix_key_type: e.target.value })}
                    >
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="telefone">Celular/Telefone</option>
                      <option value="aleatoria">Chave aleatória (EVP)</option>
                    </PremiumSelect>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Chave Pix</label>
                    <input
                      type="text"
                      value={payments.pix_key}
                      onChange={e => setPayments({ ...payments, pix_key: e.target.value })}
                      className={inputClass}
                      placeholder="Insira sua chave Pix"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowPixForm(false)}
                    className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingPayments}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white transition"
                  >
                    {savingPayments ? 'Salvando...' : 'Salvar Chave Pix'}
                  </button>
                </div>
              </form>
            )}

            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-4">
              Sua Chave Pix é armazenada de forma segura para recebimento automático dos atendimentos.
            </p>
          </div>

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
              <PremiumSelect
                value={alarmMinutes}
                onChange={(e) => setAlarmMinutes(Number(e.target.value))}
              >
                <option value="5">5 Minutos antes</option>
                <option value="10">10 Minutos antes (Padrão)</option>
                <option value="15">15 Minutos antes</option>
                <option value="20">20 Minutos antes</option>
                <option value="30">30 Minutos antes</option>
                <option value="60">1 Hora antes</option>
              </PremiumSelect>
              <button
                onClick={() => {
                  localStorage.setItem('alarm-minutes', String(alarmMinutes));
                  showAlert({ type: 'info', title: 'Alerta configurado', message: `Você será alertado ${alarmMinutes} minuto${alarmMinutes > 1 ? 's' : ''} antes de cada atendimento.` });
                }}
                className="w-full sm:w-auto shrink-0 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-slate-950 transition"
              >
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

            <div className="space-y-2 pt-2">
              {horarios.map((h, idx) => (

                <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <PremiumToggle
                      size="sm"
                      checked={h.ativo}
                      onChange={(e) => {
                        const next = [...horarios];
                        next[idx].ativo = e.target.checked;
                        setHorarios(next);
                      }}
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
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:border-blue-500"
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
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-wider">Fechado</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card: Gestão de Equipe & Auxiliares */}
          {user?.cargo !== 'auxiliar' && (
            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-sm">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Gestão de Equipe & Auxiliares</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cadastre auxiliares com e-mail obrigatoriamente no domínio @acionar.online</p>
                </div>
              </div>

              {/* Form de Cadastro/Edição */}
              <form onSubmit={handleSaveProfissional} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[11px] font-black uppercase text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  {editingProfId ? 'Editar Auxiliar / Membro da Equipe' : 'Cadastrar Novo Auxiliar / Membro da Equipe'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Nome Completo</label>
                    <input
                      type="text"
                      value={profForm.nome}
                      onChange={(e) => setProfForm({ ...profForm, nome: e.target.value })}
                      placeholder="Ex: Maria Santos"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">E-mail Corporativo (@acionar.online)</label>
                    <div className="flex items-stretch rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden dark:border-slate-800 dark:bg-slate-950/40 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition">
                      <input
                        type="text"
                        value={profForm.emailPrefix}
                        onChange={(e) => setProfForm({ ...profForm, emailPrefix: e.target.value })}
                        placeholder="patricia"
                        className="flex-1 bg-transparent px-4 py-3 text-sm font-bold text-slate-900 outline-none dark:text-slate-100 placeholder:text-slate-400"
                        required
                      />
                      <span className="flex items-center px-4 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-black border-l border-slate-200 dark:border-slate-800">
                        @acionar.online
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Senha de Acesso</label>
                    <input
                      type="password"
                      value={profForm.senha}
                      onChange={(e) => setProfForm({ ...profForm, senha: e.target.value })}
                      placeholder={editingProfId ? "Preencha apenas para alterar" : "••••••••"}
                      className={inputClass}
                      required={!editingProfId}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Cor do Selo de Identificação</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={profForm.cor_identificadora}
                        onChange={(e) => setProfForm({ ...profForm, cor_identificadora: e.target.value })}
                        className="w-12 h-10 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Usado nos selos dos agendamentos</span>
                    </div>
                  </div>
                </div>

                {/* Atende no local do cliente */}
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/20 p-4">
                  <PremiumCheckbox
                    id="chkAtendeLocal"
                    checked={profForm.aceita_atendimento_externo}
                    onChange={(e) => setProfForm({ ...profForm, aceita_atendimento_externo: e.target.checked })}
                    label="Atende no local do cliente"
                    description="Permite que este profissional receba solicitações para atendimento no endereço informado pelo cliente."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  {editingProfId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProfId(null);
                        setProfForm({ nome: '', emailPrefix: '', senha: '', cor_identificadora: '#8c52ff', aceita_atendimento_externo: false });
                      }}
                      className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black hover:opacity-90"
                    >
                      Cancelar Edição
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black shadow-lg shadow-purple-500/25 hover:opacity-90"
                  >
                    {editingProfId ? 'Salvar Alterações' : 'Cadastrar Auxiliar'}
                  </button>
                </div>
              </form>

              {/* Lista de Membros */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Membros da Equipe Cadastrados</label>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                  {profissionaisList.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/50 bg-slate-50/20 dark:border-slate-800/50 dark:bg-slate-950/20">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full border border-white/20 shadow-sm shrink-0"
                          style={{ backgroundColor: p.cor_identificadora || '#8c52ff' }}
                        />
                        <div>
                          <strong className="text-sm font-extrabold text-slate-800 dark:text-white block">{p.nome}</strong>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">
                            {p.email} • <span className="uppercase text-purple-500">{p.cargo === 'proprietario' ? 'Proprietário' : 'Auxiliar'}</span>
                            {p.aceita_atendimento_externo && ' • Atende Domicílio'}
                            {!p.ativo && ' • Inativo'}
                          </span>
                        </div>
                      </div>

                      {p.cargo !== 'proprietario' && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditProfissional(p)}
                            className="p-2.5 rounded-xl text-blue-500 hover:bg-blue-500/10 transition"
                          >
                            <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProfissional(p.id)}
                            className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {profissionaisList.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400 font-bold">
                      Nenhum auxiliar cadastrado ainda.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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

          {/* Card: Notificações de Novos Agendamentos */}
          <div className={cardClass}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-sm">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Notificações de Novos Agendamentos</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Solicita permissão do dispositivo e emite alerta detalhado quando chegar novo agendamento</p>
              </div>
            </div>

            <div className="pt-2.5">
              <button
                type="button"
                onClick={toggleAlarm}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all ${alarmEnabled
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
              >
                <Bell className="h-4 w-4" />
                {alarmEnabled ? 'Alarme Ativado 🔔' : 'Alarme Desativado 🔕'}
              </button>
            </div>
          </div>

          {/* Card: WhatsApp & Endereço */}
          <form onSubmit={handleSaveMessages} className={cardClass}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-sm">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Mensagem no WhatsApp & Endereço</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Personalize o texto enviado ao aceitar e confirmar agendamentos</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Endereço do Estabelecimento</label>
                <input
                  type="text"
                  value={messages.endereco || ''}
                  onChange={(e) => setMessages({ ...messages, endereco: e.target.value })}
                  className={inputClass}
                  placeholder="Ex: Rua da amizade 515 bairro: 14 de novembro"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">1. Modelo da Mensagem de Confirmação (Novos Agendamentos)</label>
                  <button
                    type="button"
                    onClick={() => setMessages({ ...messages, template_confirmacao: DEFAULT_CONFIRMACAO })}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-500 transition"
                  >
                    Restaurar Padrão
                  </button>
                </div>
                <textarea
                  ref={textareaConfRef}
                  rows="5"
                  value={messages.template_confirmacao || ''}
                  onFocus={() => setLastFocusedField('confirmacao')}
                  onChange={(e) => setMessages({ ...messages, template_confirmacao: e.target.value })}
                  className={`${inputClass} resize-none h-32 p-4 font-mono text-xs`}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">2. Modelo da Mensagem de Manutenção (Lembrete 2 dias antes)</label>
                    <span className="text-[10px] text-slate-400 block font-normal">Enviada ao clicar em "Lembrete Manutenção" nos agendamentos de retorno</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMessages({ ...messages, template_manutencao: DEFAULT_MANUTENCAO })}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-500 transition"
                  >
                    Restaurar Padrão
                  </button>
                </div>
                <textarea
                  ref={textareaManutRef}
                  rows="5"
                  value={messages.template_manutencao || ''}
                  onFocus={() => setLastFocusedField('manutencao')}
                  onChange={(e) => setMessages({ ...messages, template_manutencao: e.target.value })}
                  className={`${inputClass} resize-none h-32 p-4 font-mono text-xs`}
                  required
                />
              </div>

              {/* Toque para inserir variáveis */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Toque para inserir variáveis na mensagem:</label>
                <div className="flex flex-wrap gap-1.5">
                  {['{cliente}', '{servico}', '{data}', '{hora}', '{endereco}'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="px-3 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-all select-none"
                    >
                      +{v}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-animated py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-black text-white shadow-lg shadow-emerald-500/20"
              >
                {loading ? 'Salvando...' : '✓ Salvar Configurações de Mensagens'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
