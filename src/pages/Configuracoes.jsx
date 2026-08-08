import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Settings, Users, Bell, Globe, Palette, Copy, Check, Clock, MessageSquare, MapPin, ShieldAlert, Plus, Trash2, Upload, Image as ImageIcon, CreditCard, Loader2, Power, QrCode, Sparkles, ArrowLeft, ChevronRight, Pencil, X } from 'lucide-react';
import { ModalAlert, useModalAlert } from '../components/ModalAlert';
import { PremiumToggle } from '../components/PremiumToggle';
import { PremiumCheckbox } from '../components/PremiumCheckbox';
import { PremiumSelect } from '../components/PremiumSelect';
import { BotFlowBuilder } from './BotFlowBuilder';
import { HelpBadge } from '../components/HelpBadge';

export function Configuracoes() {
  const { tenant, setTenant, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [message, setMessage] = useState('');
  const { alertState, showAlert, closeAlert } = useModalAlert();
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmMinutes, setAlarmMinutes] = useState(10);

  // Form de Configurações da Agenda Pública & Perfil
  const [form, setForm] = useState({
    agenda_publica_ativa: tenant?.agenda_publica_ativa ?? true,
    visualizacao_padrao: tenant?.visualizacao_padrao || 'grade',
    permitir_cancelamento_cliente: tenant?.permitir_cancelamento_cliente ?? true,
    empresa_nome: tenant?.empresa_nome || '',
    slug_publico: tenant?.slug_publico || '',
    cor_primaria: tenant?.cor_primaria || '#2563eb',
    cor_secundaria: tenant?.cor_secundaria || '#3b82f6',
    cor_fundo_card: tenant?.cor_fundo_card || '#ffffff',
    cor_texto_principal: tenant?.cor_texto_principal || '#0f172a',
    cor_texto_secundario: tenant?.cor_texto_secundario || '#64748b',
    foto_url: tenant?.foto_url || '',
  });

  const [endereco, setEndereco] = useState('');

  // Equipe / Profissionais Modal e Form State
  const [profissionais, setProfissionais] = useState([]);
  const [showProfModal, setShowProfModal] = useState(false);
  const [editingProf, setEditingProf] = useState(null);
  const [profForm, setProfForm] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    senha: '',
    cargo: 'auxiliar',
    cor_identificadora: '#8c52ff',
    aceita_atendimento_externo: false
  });

  const [logoError, setLogoError] = useState(false);

  // WhatsApp Integration states
  const [whatsappStatus, setWhatsappStatus] = useState({ connected: false, state: 'close', number: null, connected_since: null });
  const [whatsappQrCode, setWhatsappQrCode] = useState(null);
  const [loadingWhatsapp, setLoadingWhatsapp] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [showBotBuilder, setShowBotBuilder] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const fetchWhatsappStatus = async () => {
    try {
      const data = await apiRequest('/whatsapp/status');
      if (data) {
        setWhatsappStatus({
          connected: Boolean(data.connected),
          state: data.state || 'close',
          number: data.number || null,
          connected_since: data.connected_since || null
        });

        if (data.connected) {
          setWhatsappQrCode(null);
          setShowQrModal(false); // Fecha o modal pop-up automaticamente quando conectado!
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
        } else if (data.qrcode) {
          setWhatsappQrCode(data.qrcode);
        }
      }
    } catch (e) {
      console.warn('[WHATSAPP STATUS WAIT]', e.message);
    }
  };

  useEffect(() => {
    fetchWhatsappStatus();
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, []);

  const handleConnectWhatsapp = async () => {
    setLoadingWhatsapp(true);
    setWhatsappQrCode(null);
    setShowQrModal(true); // Abre o modal pop-up do QR Code
    try {
      const res = await apiRequest('/whatsapp/connect', 'POST');
      if (res.qrcode) {
        setWhatsappQrCode(res.qrcode);
      }
      setWhatsappStatus(prev => ({ ...prev, connected: false, state: 'connecting' }));
      
      if (!pollingInterval) {
        const interval = setInterval(() => {
          fetchWhatsappStatus();
        }, 3000);
        setPollingInterval(interval);
      }
    } catch (e) {
      showAlert({ title: 'Erro de Conexão', message: 'Erro ao gerar QR Code: ' + e.message, type: 'error' });
    } finally {
      setLoadingWhatsapp(false);
    }
  };

  const handleDisconnectWhatsapp = async () => {
    setLoadingWhatsapp(true);
    try {
      await apiRequest('/whatsapp/disconnect', 'POST');
      setWhatsappStatus({ connected: false, state: 'close', number: null, connected_since: null });
      setWhatsappQrCode(null);
      setShowQrModal(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      showAlert({ title: 'Desconectado', message: 'WhatsApp desconectado com sucesso.', type: 'info' });
    } catch (e) {
      showAlert({ title: 'Erro', message: 'Erro ao desconectar: ' + e.message, type: 'error' });
    } finally {
      setLoadingWhatsapp(false);
    }
  };

  const getConnectedDuration = (sinceIso) => {
    if (!sinceIso) return 'Conectado recentemente';
    const since = new Date(sinceIso);
    const now = new Date();
    const diffTime = Math.abs(now - since);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const dateFormatted = since.toLocaleDateString('pt-BR');

    if (diffDays === 0) {
      return `Conectado hoje (desde ${dateFormatted})`;
    } else if (diffDays === 1) {
      return `Conectado há 1 dia (desde ${dateFormatted})`;
    } else {
      return `Conectado há ${diffDays} dias (desde ${dateFormatted})`;
    }
  };

  const formatPhoneNumber = (num) => {
    if (!num) return 'Número do Estabelecimento';
    const clean = String(num).replace(/\D/g, '');
    if (clean.length === 13 && clean.startsWith('55')) {
      const ddd = clean.substring(2, 4);
      const part1 = clean.substring(4, 9);
      const part2 = clean.substring(9);
      return `+55 (${ddd}) ${part1}-${part2}`;
    } else if (clean.length === 12 && clean.startsWith('55')) {
      const ddd = clean.substring(2, 4);
      const part1 = clean.substring(4, 8);
      const part2 = clean.substring(8);
      return `+55 (${ddd}) ${part1}-${part2}`;
    }
    return `+${clean}`;
  };

  const fileInputRef = useRef(null);

  // Horários de Funcionamento (Segunda a Domingo)
  const [horarios, setHorarios] = useState({
    segunda: { ativo: true, inicio: '08:00', fim: '18:00' },
    terca: { ativo: true, inicio: '08:00', fim: '18:00' },
    quarta: { ativo: true, inicio: '08:00', fim: '18:00' },
    quinta: { ativo: true, inicio: '08:00', fim: '18:00' },
    sexta: { ativo: true, inicio: '08:00', fim: '18:00' },
    sabado: { ativo: true, inicio: '08:00', fim: '16:00' },
    domingo: { ativo: false, inicio: '08:00', fim: '12:00' },
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        agenda_publica_ativa: tenant.agenda_publica_ativa ?? true,
        visualizacao_padrao: tenant.visualizacao_padrao || 'grade',
        permitir_cancelamento_cliente: tenant.permitir_cancelamento_cliente ?? true,
        empresa_nome: tenant.empresa_nome || '',
        slug_publico: tenant.slug_publico || '',
        cor_primaria: tenant.cor_primaria || '#2563eb',
        cor_secundaria: tenant.cor_secundaria || '#3b82f6',
        cor_fundo_card: tenant.cor_fundo_card || '#ffffff',
        cor_texto_principal: tenant.cor_texto_principal || '#0f172a',
        cor_texto_secundario: tenant.cor_texto_secundario || '#64748b',
        foto_url: tenant.foto_url || '',
      });
    }
  }, [tenant]);

  useEffect(() => {
    fetchProfissionais();
    fetchEndereco();
    const saved = localStorage.getItem('alarm-enabled');
    if (saved === 'true') setAlarmEnabled(true);
    const savedMin = localStorage.getItem('alarm-minutes');
    if (savedMin) setAlarmMinutes(Number(savedMin));
  }, []);

  const toggleAlarm = async () => {
    if (!alarmEnabled) {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          showAlert({ type: 'warning', title: 'Permissão necessária', message: 'Permita as notificações no seu navegador para atuar o alarme.' });
          return;
        }
      }
      setAlarmEnabled(true);
      localStorage.setItem('alarm-enabled', 'true');
      showAlert({ type: 'success', title: 'Alarme Ativado', message: 'Você receberá alertas visuais e sonoros quando um novo agendamento chegar.' });
    } else {
      setAlarmEnabled(false);
      localStorage.setItem('alarm-enabled', 'false');
      showAlert({ type: 'info', title: 'Alarme Desativado', message: 'Notificações automáticas desativadas.' });
    }
  };

  const fetchEndereco = async () => {
    try {
      const data = await apiRequest('/config/messages');
      if (data && data.settings && data.settings.endereco) {
        setEndereco(data.settings.endereco);
      }
    } catch (err) {
      console.error('Erro ao carregar endereço:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const updatedTenant = await apiRequest('/config/public-schedule', 'PUT', form);
      if (updatedTenant && updatedTenant.tenant) {
        setTenant(updatedTenant.tenant);
      }
      if (endereco) {
        await apiRequest('/config/messages', 'PUT', { endereco });
      }
      showAlert({ type: 'success', title: 'Sucesso', message: 'Configurações do perfil salvas com sucesso!' });
    } catch (err) {
      showAlert({ type: 'error', title: 'Erro', message: err.message || 'Erro ao salvar configurações.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfissionais = async () => {
    try {
      const data = await apiRequest('/profissionais');
      if (Array.isArray(data)) setProfissionais(data);
      else if (data && Array.isArray(data.profissionais)) setProfissionais(data.profissionais);
    } catch (err) {
      console.error('Erro ao buscar equipe:', err);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert({ type: 'warning', title: 'Arquivo muito grande', message: 'A imagem deve ter no máximo 5MB.' });
      return;
    }

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await apiRequest('/config/upload-logo', 'POST', { imageBase64: reader.result });
        if (res && res.foto_url) {
          setForm(prev => ({ ...prev, foto_url: res.foto_url }));
          setLogoError(false);
          if (tenant) {
            setTenant({ ...tenant, foto_url: res.foto_url });
          }
          showAlert({ type: 'success', title: 'Logotipo atualizado', message: 'Imagem do logotipo salva com sucesso na VPS!' });
        }
      } catch (err) {
        showAlert({ type: 'error', title: 'Erro', message: err.message || 'Erro ao enviar a imagem.' });
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddProf = () => {
    setEditingProf(null);
    setProfForm({
      nome: '',
      email: '',
      whatsapp: '',
      senha: '',
      cargo: 'auxiliar',
      cor_identificadora: '#8c52ff',
      aceita_atendimento_externo: false
    });
    setShowProfModal(true);
  };

  const handleOpenEditProf = (p) => {
    setEditingProf(p);
    setProfForm({
      nome: p.nome || '',
      email: p.email || '',
      whatsapp: p.whatsapp || p.telefone || '',
      senha: '',
      cargo: p.cargo || 'auxiliar',
      cor_identificadora: p.cor_identificadora || '#8c52ff',
      aceita_atendimento_externo: Boolean(p.aceita_atendimento_externo)
    });
    setShowProfModal(true);
  };

  const handleSaveProfissional = async (e) => {
    e.preventDefault();
    if (!profForm.nome || !profForm.email) {
      showAlert({ type: 'warning', title: 'Campos obrigatórios', message: 'Nome e E-mail são obrigatórios.' });
      return;
    }

    if (!editingProf && !profForm.senha) {
      showAlert({ type: 'warning', title: 'Senha obrigatória', message: 'Informe a senha para o novo profissional.' });
      return;
    }

    setLoading(true);
    try {
      if (editingProf) {
        await apiRequest(`/profissionais/${editingProf.id}`, 'PUT', profForm);
        showAlert({ type: 'success', title: 'Sucesso', message: 'Dados do profissional atualizados com sucesso!' });
      } else {
        await apiRequest('/profissionais', 'POST', profForm);
        showAlert({ type: 'success', title: 'Sucesso', message: 'Novo profissional cadastrado com sucesso!' });
      }
      setShowProfModal(false);
      fetchProfissionais();
    } catch (err) {
      showAlert({ type: 'error', title: 'Erro', message: err.message || 'Erro ao salvar profissional.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProfissional = (p) => {
    if (p.cargo === 'proprietario') {
      showAlert({ type: 'warning', title: 'Ação não permitida', message: 'Não é possível excluir o profissional proprietário.' });
      return;
    }

    showAlert({
      type: 'warning',
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja remover o profissional ${p.nome}?`,
      confirmLabel: 'Sim, remover',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        closeAlert();
        try {
          setLoading(true);
          await apiRequest(`/profissionais/${p.id}`, 'DELETE');
          showAlert({ type: 'success', message: 'Profissional removido com sucesso!' });
          fetchProfissionais();
        } catch (err) {
          showAlert({ type: 'error', message: err.message || 'Erro ao remover profissional.' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const selectClass = "w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-blue-500";
  const inputClass = "w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-blue-500 placeholder:text-slate-400";
  const cardClass = "rounded-3xl border border-slate-200 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/60 p-6 shadow-xl space-y-4 backdrop-blur-xl transition-all duration-300";

  const isProprietario = user?.cargo === 'proprietario';

  useEffect(() => {
    if (!isProprietario && ['whatsapp', 'perfil', 'equipe'].includes(activeCategory)) {
      setActiveCategory(null);
    }
  }, [activeCategory, isProprietario]);

  const categoriesList = [
    ...(isProprietario ? [{
      id: 'whatsapp',
      title: 'Robô do WhatsApp',
      badge: whatsappStatus.connected ? 'Conectado' : 'Desconectado',
      badgeClass: whatsappStatus.connected ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
      icon: MessageSquare,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      helpTitle: 'Robô de WhatsApp',
      helpDesc: 'Configure a conexão do WhatsApp do seu estabelecimento e personalize as mensagens automáticas de confirmação.'
    }] : []),
    {
      id: 'horarios',
      title: 'Horários & Bloqueios',
      icon: Clock,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      helpTitle: 'Horários de Funcionamento',
      helpDesc: 'Defina os dias e horários em que atende e configure bloqueios ou folgas na sua agenda.'
    },
    ...(isProprietario ? [{
      id: 'perfil',
      title: 'Perfil & Agenda Pública',
      icon: Globe,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      helpTitle: 'Perfil & Agenda Pública',
      helpDesc: 'Configure o logotipo do seu negócio, nome da empresa, endereço físico e o link da agenda online para os clientes agendarem sozinhos.'
    }] : []),
    {
      id: 'notificacoes',
      title: 'Notificações & Alertas',
      badge: alarmEnabled ? 'Alarme Ativo' : 'Alarme Desativado',
      badgeClass: alarmEnabled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
      icon: Bell,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      helpTitle: 'Notificações de Agendamento',
      helpDesc: 'Ative o som de alarme em tempo real para ser avisado assim que um novo agendamento chegar.'
    },
    ...(isProprietario ? [{
      id: 'equipe',
      title: 'Equipe & Auxiliares',
      icon: Users,
      iconBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
      helpTitle: 'Equipe de Atendimento',
      helpDesc: 'Cadastre, edite ou remova profissionais da equipe e gerencie permissões e atendimentos a domicílio.'
    }] : []),
    {
      id: 'tema',
      title: 'Aparência & Tema',
      icon: Palette,
      iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
      helpTitle: 'Aparência da Plataforma',
      helpDesc: 'Escolha entre modo claro ou escuro para personalizar o visual do seu sistema.'
    }
  ];

  if (showBotBuilder) {
    return <BotFlowBuilder onBack={() => setShowBotBuilder(false)} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <ModalAlert {...alertState} onClose={closeAlert} />

      {/* Modal Pop-up do QR Code do WhatsApp */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-scale-up text-center">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <QrCode className="h-5 w-5" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Conectar Robô do WhatsApp</h3>
              </div>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingWhatsapp ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Gerando código seguro de conexão...</p>
              </div>
            ) : whatsappQrCode ? (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                  Abra o WhatsApp no celular, vá em <strong>Aparelhos Conectados &gt; Conectar um Aparelho</strong> e aponte a câmera para o código:
                </p>

                <div className="p-4 bg-white rounded-3xl shadow-xl border-2 border-emerald-500/30 inline-block">
                  <img
                    src={whatsappQrCode}
                    alt="QR Code do WhatsApp"
                    className="h-56 w-56 object-contain rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-black text-amber-500 dark:text-amber-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Aguardando leitura do QR Code...</span>
                </div>

                <button
                  type="button"
                  onClick={handleConnectWhatsapp}
                  className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                >
                  Atualizar QR Code
                </button>
              </div>
            ) : (
              <div className="py-8 space-y-4">
                <p className="text-xs text-slate-500">Clique abaixo para gerar um novo QR Code de conexão.</p>
                <button
                  type="button"
                  onClick={handleConnectWhatsapp}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-black text-white shadow-lg shadow-emerald-500/20"
                >
                  Gerar QR Code
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição de Profissional */}
      {showProfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingProf ? `Editar ${editingProf.nome}` : 'Cadastrar Novo Profissional'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingProf ? 'Atualize os dados e acessos do integrante da equipe.' : 'Adicione um novo membro para atender no estabelecimento.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowProfModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfissional} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={profForm.nome}
                  onChange={(e) => setProfForm({ ...profForm, nome: e.target.value })}
                  className={inputClass}
                  placeholder="Ex: Carlos Oliveira"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">E-mail (Login) *</label>
                  <input
                    type="email"
                    value={profForm.email}
                    onChange={(e) => setProfForm({ ...profForm, email: e.target.value })}
                    className={inputClass}
                    placeholder="carlos@empresa.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">WhatsApp / Celular</label>
                  <input
                    type="text"
                    value={profForm.whatsapp}
                    onChange={(e) => setProfForm({ ...profForm, whatsapp: e.target.value })}
                    className={inputClass}
                    placeholder="(45) 99999-8888"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Senha {editingProf ? '(Opcional)' : '*'}
                </label>
                <input
                  type="password"
                  value={profForm.senha}
                  onChange={(e) => setProfForm({ ...profForm, senha: e.target.value })}
                  className={inputClass}
                  placeholder={editingProf ? 'Deixe em branco para manter a senha atual' : 'Digite a senha do usuário'}
                  required={!editingProf}
                />
                {editingProf && (
                  <span className="text-[10px] text-slate-400 block mt-1">Preencha apenas se quiser redefinir a senha do usuário.</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Cargo / Função</label>
                  <PremiumSelect
                    value={profForm.cargo}
                    onChange={(e) => setProfForm({ ...profForm, cargo: e.target.value })}
                  >
                    <option value="auxiliar">Auxiliar / Profissional</option>
                    <option value="administrador">Administrador</option>
                  </PremiumSelect>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Cor na Agenda</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profForm.cor_identificadora}
                      onChange={(e) => setProfForm({ ...profForm, cor_identificadora: e.target.value })}
                      className="h-11 w-14 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer p-0.5 bg-white dark:bg-slate-950 shrink-0"
                    />
                    <input
                      type="text"
                      value={profForm.cor_identificadora}
                      onChange={(e) => setProfForm({ ...profForm, cor_identificadora: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Aceita Atendimento a Domicílio?</h4>
                  <p className="text-[10px] text-slate-500">Receberá alertas para atendimentos externos.</p>
                </div>
                <PremiumToggle
                  checked={profForm.aceita_atendimento_externo}
                  onChange={(e) => setProfForm({ ...profForm, aceita_atendimento_externo: e.target.checked })}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfModal(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-xs font-black text-white shadow-lg shadow-pink-500/20 transition disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : editingProf ? 'Salvar Alterações' : 'Cadastrar Profissional'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Navegação Hub em Cards vs Tela de Categoria Específica */}
      {activeCategory === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
          {categoriesList.map(cat => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="group relative rounded-3xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/60 p-6 shadow-xl hover:shadow-2xl backdrop-blur-xl transition-all duration-300 cursor-pointer hover:border-blue-500/50 hover:scale-[1.02] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold shadow-md transition-transform group-hover:scale-110 ${cat.iconBg}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {cat.badge && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${cat.badgeClass}`}>
                        {cat.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {cat.title}
                    </h3>
                    <HelpBadge title={cat.helpTitle} description={cat.helpDesc} />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
                  <span>Abrir Configuração</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black transition-all shadow-sm mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para Todas as Configurações</span>
          </button>

          {/* Categoria: Robô de WhatsApp */}
          {activeCategory === 'whatsapp' && (
            <div className={cardClass}>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-sm">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Robô de WhatsApp</h3>
                      <HelpBadge
                        title="Robô de WhatsApp"
                        description="Conecte seu WhatsApp lendo o QR Code para enviar confirmações e lembretes automáticos para seus clientes sem pagar taxas adicionais."
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  {whatsappStatus.connected ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80">
                      Desconectado
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-5 pt-2">
                {whatsappStatus.connected ? (
                  <div className="space-y-4">
                    {/* Painel de Informações de Conexão */}
                    <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Status da Sessão:</span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Ativo & Operacional
                        </span>
                      </div>

                      {whatsappStatus.number && (
                        <div className="flex items-center justify-between border-t border-emerald-500/10 pt-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Número Conectado:</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{formatPhoneNumber(whatsappStatus.number)}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-emerald-500/10 pt-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Tempo Online:</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {getConnectedDuration(whatsappStatus.connected_since)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowBotBuilder(true)}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 font-black text-xs text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    >
                      <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                      Personalizar Robô do WhatsApp
                    </button>

                    <button
                      type="button"
                      disabled={loadingWhatsapp}
                      onClick={handleDisconnectWhatsapp}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 font-black text-xs text-white shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Power className="h-4 w-4" />
                      Desconectar WhatsApp
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setShowBotBuilder(true)}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 font-black text-xs text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    >
                      <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                      Personalizar Robô do WhatsApp
                    </button>

                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-center space-y-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Conecte o WhatsApp do seu estabelecimento para enviar mensagens automáticas de confirmação e lembretes para seus clientes.
                      </p>

                      <button
                        type="button"
                        disabled={loadingWhatsapp}
                        onClick={handleConnectWhatsapp}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black text-xs text-white shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        {loadingWhatsapp ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Gerando Código...
                          </>
                        ) : (
                          <>
                            <QrCode className="h-4 w-4" />
                            Gerar QR Code de Conexão
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Categoria: Perfil & Agenda Pública */}
          {activeCategory === 'perfil' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className={cardClass}>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-500 dark:text-blue-400" /> Agenda Pública Online?
                    </h3>
                  </div>
                  <PremiumToggle
                    checked={form.agenda_publica_ativa}
                    onChange={(e) => setForm({ ...form, agenda_publica_ativa: e.target.checked })}
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">Nome da Sua Empresa</label>
                    <input
                      type="text"
                      value={form.empresa_nome}
                      onChange={(e) => setForm({ ...form, empresa_nome: e.target.value })}
                      className={inputClass}
                      placeholder="Ex: Espaço Beleza & Estilo"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">Endereço Físico do Estabelecimento</label>
                    <input
                      type="text"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      className={inputClass}
                      placeholder="Ex: Rua da Amizade 515, Cascavel - PR"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">Link da Sua Agenda Pública</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={form.slug_publico}
                        onChange={(e) => setForm({ ...form, slug_publico: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        className={inputClass}
                        placeholder="minha-empresa"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-animated py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-black text-white shadow-lg shadow-blue-500/20"
                  >
                    {loading ? 'Salvando...' : 'Salvar Alterações de Perfil'}
                  </button>
                </div>
              </div>

              {/* Card Logotipo */}
              <div className={cardClass}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-sm">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Foto do Logotipo</h3>
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
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Categoria: Horários & Bloqueios */}
          {activeCategory === 'horarios' && (
            <div className="space-y-6">
              <div className={cardClass}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-sm">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Horários de Funcionamento</h3>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {Object.keys(horarios).map((dia) => (
                    <div key={dia} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-black capitalize text-slate-800 dark:text-slate-200">{dia}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={horarios[dia].inicio}
                          onChange={(e) => setHorarios({ ...horarios, [dia]: { ...horarios[dia], inicio: e.target.value } })}
                          className="px-2 py-1 bg-white dark:bg-slate-900 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800"
                        />
                        <span className="text-xs font-bold text-slate-400">até</span>
                        <input
                          type="time"
                          value={horarios[dia].fim}
                          onChange={(e) => setHorarios({ ...horarios, [dia]: { ...horarios[dia], fim: e.target.value } })}
                          className="px-2 py-1 bg-white dark:bg-slate-900 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Categoria: Notificações & Alertas */}
          {activeCategory === 'notificacoes' && (
            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-sm">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Notificações & Alarme</h3>
                </div>
              </div>

              <div className="pt-2">
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
          )}

          {/* Categoria: Equipe & Auxiliares */}
          {activeCategory === 'equipe' && (
            <div className={cardClass}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold shadow-sm">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Equipe de Profissionais</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Gerencie todos os membros do seu estabelecimento</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddProf}
                  className="btn-animated inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-pink-500/20 transition shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar Profissional
                </button>
              </div>

              {/* Lista da Equipe */}
              <div className="space-y-3 pt-2">
                {profissionais.length === 0 ? (
                  <div className="py-8 text-center text-xs font-bold text-slate-400">
                    Nenhum profissional cadastrado. Clique em "+ Cadastrar Profissional" acima.
                  </div>
                ) : (
                  profissionais.map(p => (
                    <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md shrink-0"
                          style={{ backgroundColor: p.cor_identificadora || '#8c52ff' }}
                        >
                          {p.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">{p.nome}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              p.cargo === 'proprietario' 
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : p.cargo === 'administrador'
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {p.cargo || 'auxiliar'}
                            </span>
                            {p.aceita_atendimento_externo && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                🏠 Domicílio
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                            <span>{p.email}</span>
                            {(p.whatsapp || p.telefone) && (
                              <span className="font-semibold text-slate-500">📱 {p.whatsapp || p.telefone}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEditProf(p)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                          title="Editar dados e acesso"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>

                        {p.cargo !== 'proprietario' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProfissional(p)}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition"
                            title="Remover integrante da equipe"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Categoria: Aparência & Tema */}
          {activeCategory === 'tema' && (
            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold shadow-sm">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Aparência & Tema</h3>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                    showAlert({ type: 'info', title: 'Tema Claro Ativado' });
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 text-center transition"
                >
                  ☀️ Tema Claro
                </button>

                <button
                  type="button"
                  onClick={() => {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                    showAlert({ type: 'info', title: 'Tema Escuro Ativado' });
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 text-center transition"
                >
                  🌙 Modo Escuro
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
