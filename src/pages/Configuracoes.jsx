import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Settings, Users, Bell, Globe, Palette, Copy, Check, Clock, MessageSquare, MapPin, ShieldAlert, Plus, Trash2, Upload, Image as ImageIcon, CreditCard, Loader2, Power, QrCode, Sparkles, ArrowLeft, ChevronRight } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [message, setMessage] = useState('');
  const [savingPayments, setSavingPayments] = useState(false);
  const [showPixForm, setShowPixForm] = useState(false);
  const [payments, setPayments] = useState({ pix_key: '' });
  const { alertState, showAlert, closeAlert } = useModalAlert();
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmMinutes, setAlarmMinutes] = useState(10);
  const [statsOpen, setStatsOpen] = useState(false);

  // Form de Configurações da Agenda Pública
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

  // Equipe / Profissionais Auxiliares
  const [profissionais, setProfissionais] = useState([]);
  const [novoProfissional, setNovoProfissional] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    senha: '',
    cor_identificadora: '#8c52ff',
    aceita_atendimento_externo: false
  });
  const [logoError, setLogoError] = useState(false);

  // WhatsApp Integration states
  const [whatsappStatus, setWhatsappStatus] = useState({ connected: false, state: 'close' });
  const [whatsappQrCode, setWhatsappQrCode] = useState(null);
  const [loadingWhatsapp, setLoadingWhatsapp] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [showBotBuilder, setShowBotBuilder] = useState(false);

  const fetchWhatsappStatus = async () => {
    try {
      const data = await apiRequest('/whatsapp/status');
      setWhatsappStatus({ connected: data.connected, state: data.state });
      if (data.connected) {
        setWhatsappQrCode(null);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      } else if (data.qrcode) {
        setWhatsappQrCode(data.qrcode);
      }
    } catch (e) {
      console.error('Erro ao verificar status WhatsApp:', e);
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
    try {
      const res = await apiRequest('/whatsapp/connect', 'POST');
      if (res.qrcode) {
        setWhatsappQrCode(res.qrcode);
      }
      setWhatsappStatus({ connected: false, state: 'connecting' });
      
      if (!pollingInterval) {
        const interval = setInterval(() => {
          fetchWhatsappStatus();
        }, 5000);
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
      setWhatsappStatus({ connected: false, state: 'close' });
      setWhatsappQrCode(null);
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

  const fileInputRef = useRef(null);

  // Modelos de Mensagens Automáticas
  const DEFAULT_CONFIRMACAO = `📍 *Endereço*: {endereco}\n\nPor gentileza, informe se concorda com este horário ou se prefere realizar alguma alteração.\n\n📌 *Lembrete importante*: Pedimos a gentileza de chegar com **15 minutos de antecedência**.\n\nAgradecemos a preferência e aguardamos você!😊`;
  const DEFAULT_MANUTENCAO = `Olá, *{cliente}*! 👋\n\nPassando para lembrar que sua *MANUTENÇÃO PERIÓDICA* de *{servico}* está agendada para o dia *{data}* às *{hora}*.\n\n📍 *Endereço*: {endereco}`;

  const [messages, setMessages] = useState({
    endereco: 'Rua da amizade 515 bairro: 14 de novembro',
    template_confirmacao: DEFAULT_CONFIRMACAO,
    template_manutencao: DEFAULT_MANUTENCAO,
  });
  const [lastFocusedField, setLastFocusedField] = useState('confirmacao');

  const textareaConfRef = useRef(null);
  const textareaManutRef = useRef(null);

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

  const [bloqueios, setBloqueios] = useState([]);
  const [novoBloqueio, setNovoBloqueio] = useState({ inicio: '', fim: '', motivo: '' });

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
    fetchMessages();
    fetchPaymentConfig();
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

  const fetchPaymentConfig = async () => {
    try {
      const data = await apiRequest('/config/payments');
      if (data && data.payments) setPayments(data.payments);
    } catch (err) {
      console.error('Erro ao buscar chave pix:', err);
    }
  };

  const handleSavePayments = async (e) => {
    e.preventDefault();
    setSavingPayments(true);
    try {
      await apiRequest('/config/payments', 'PUT', payments);
      showAlert({ type: 'success', title: 'Sucesso', message: 'Chave Pix salva com sucesso.' });
      setShowPixForm(false);
    } catch (err) {
      showAlert({ type: 'error', title: 'Erro', message: err.message || 'Erro ao salvar chave Pix.' });
    } finally {
      setSavingPayments(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await apiRequest('/config/messages');
      if (data && data.settings) setMessages(data.settings);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  };

  const handleSaveMessages = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest('/config/messages', 'PUT', messages);
      showAlert({ type: 'success', title: 'Sucesso', message: 'Configurações de mensagens salvas.' });
    } catch (err) {
      showAlert({ type: 'error', title: 'Erro', message: err.message || 'Erro ao salvar mensagens.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInsertVariable = (variable) => {
    if (lastFocusedField === 'confirmacao') {
      const el = textareaConfRef.current;
      if (el) {
        const start = el.selectionStart || 0;
        const end = el.selectionEnd || 0;
        const text = messages.template_confirmacao || '';
        const updated = text.substring(0, start) + variable + text.substring(end);
        setMessages({ ...messages, template_confirmacao: updated });
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(start + variable.length, start + variable.length);
        }, 50);
      }
    } else {
      const el = textareaManutRef.current;
      if (el) {
        const start = el.selectionStart || 0;
        const end = el.selectionEnd || 0;
        const text = messages.template_manutencao || '';
        const updated = text.substring(0, start) + variable + text.substring(end);
        setMessages({ ...messages, template_manutencao: updated });
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(start + variable.length, start + variable.length);
        }, 50);
      }
    }
  };

  const fetchProfissionais = async () => {
    try {
      const data = await apiRequest('/profissionais');
      if (Array.isArray(data)) setProfissionais(data);
      else if (data && Array.isArray(data.profissionais)) setProfissionais(data.profissionais);
    } catch (err) {
      console.error('Erro ao buscar auxiliares:', err);
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
      showAlert({ type: 'success', title: 'Sucesso', message: 'Configurações da agenda salvas com sucesso!' });
    } catch (err) {
      showAlert({ type: 'error', title: 'Erro', message: err.message || 'Erro ao salvar configurações.' });
    } finally {
      setLoading(false);
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

  const handleAddProfissional = async (e) => {
    e.preventDefault();
    if (!novoProfissional.nome || !novoProfissional.email || !novoProfissional.senha) {
      showAlert({ type: 'warning', title: 'Campos obrigatórios', message: 'Preencha Nome, E-mail e Senha do novo auxiliar.' });
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/profissionais', 'POST', {
        ...novoProfissional,
        cargo: 'auxiliar'
      });
      showAlert({ type: 'success', title: 'Sucesso', message: 'Novo auxiliar cadastrado com sucesso!' });
      setNovoProfissional({
        nome: '',
        email: '',
        whatsapp: '',
        senha: '',
        cor_identificadora: '#8c52ff',
        aceita_atendimento_externo: false
      });
      fetchProfissionais();
    } catch (err) {
      showAlert({ type: 'error', title: 'Erro', message: err.message || 'Erro ao cadastrar auxiliar.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProfissional = (id) => {
    showAlert({
      type: 'warning',
      title: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja remover este auxiliar?',
      confirmLabel: 'Sim, remover',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        closeAlert();
        try {
          setLoading(true);
          await apiRequest(`/profissionais/${id}`, 'DELETE');
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

  const categoriesList = [
    {
      id: 'whatsapp',
      title: 'Robô do WhatsApp',
      badge: whatsappStatus.connected ? 'Conectado' : 'Desconectado',
      badgeClass: whatsappStatus.connected ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
      icon: MessageSquare,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      helpTitle: 'Robô de WhatsApp',
      helpDesc: 'Configure a conexão do WhatsApp do seu estabelecimento e personalize as mensagens automáticas de confirmação.'
    },
    {
      id: 'horarios',
      title: 'Horários & Bloqueios',
      icon: Clock,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      helpTitle: 'Horários de Funcionamento',
      helpDesc: 'Defina os dias e horários em que seu estabelecimento atende e configure bloqueios ou folgas especiais.'
    },
    {
      id: 'perfil',
      title: 'Perfil & Agenda Pública',
      icon: Globe,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      helpTitle: 'Perfil & Agenda Pública',
      helpDesc: 'Configure o logotipo do seu negócio, nome da empresa e o link da agenda online para os clientes agendarem sozinhos.'
    },
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
    {
      id: 'mensagens',
      title: 'Modelos de Mensagens',
      icon: MessageSquare,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      helpTitle: 'Modelos de Mensagens',
      helpDesc: 'Cadastre o endereço físico que aparece nas mensagens e os modelos de manutenção periódica.'
    },
    {
      id: 'equipe',
      title: 'Equipe & Auxiliares',
      icon: Users,
      iconBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
      helpTitle: 'Equipe de Atendimento',
      helpDesc: 'Gerencie os profissionais auxiliares cadastrados que atendem no seu estabelecimento.'
    },
    {
      id: 'tema',
      title: 'Aparência & Tema',
      icon: Palette,
      iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
      helpTitle: 'Aparência da Plataforma',
      helpDesc: 'Escolha entre modo claro ou escuro para personalizar o visual do sistema.'
    }
  ];

  if (showBotBuilder) {
    return <BotFlowBuilder onBack={() => setShowBotBuilder(false)} />;
  }

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
              <div className="flex items-center justify-between">
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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Conectado
                    </span>
                  ) : whatsappStatus.state === 'connecting' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Aguardando Leitura
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80">
                      Desconectado
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                {whatsappStatus.connected ? (
                  <div className="space-y-3">
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
                    {whatsappQrCode ? (
                      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center mb-4 leading-relaxed">
                          Abra o WhatsApp no seu celular, vá em <strong>Aparelhos Conectados</strong> e escaneie o código abaixo:
                        </p>
                        
                        <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-100 inline-block mb-4">
                          <img 
                            src={whatsappQrCode} 
                            alt="QR Code de Conexão" 
                            className="h-48 w-48 object-contain"
                          />
                        </div>
                        
                        <button
                          type="button"
                          onClick={fetchWhatsappStatus}
                          className="text-xs font-black text-blue-600 hover:text-blue-500 flex items-center gap-1"
                        >
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Atualizar Status Manualmente
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-center">
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
                    )}
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

          {/* Categoria: Modelos de Mensagens */}
          {activeCategory === 'mensagens' && (
            <form onSubmit={handleSaveMessages} className={cardClass}>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-sm">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Modelos de Mensagens</h3>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">Endereço Físico</label>
                  <input
                    type="text"
                    value={messages.endereco || ''}
                    onChange={(e) => setMessages({ ...messages, endereco: e.target.value })}
                    className={inputClass}
                    placeholder="Rua da Amizade 515, Cascavel - PR"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">Mensagem de Confirmação</label>
                  <textarea
                    ref={textareaConfRef}
                    rows="4"
                    value={messages.template_confirmacao || ''}
                    onFocus={() => setLastFocusedField('confirmacao')}
                    onChange={(e) => setMessages({ ...messages, template_confirmacao: e.target.value })}
                    className={`${inputClass} resize-none p-4 font-mono text-xs`}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-animated py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-black text-white shadow-lg shadow-purple-500/20"
                >
                  {loading ? 'Salvando...' : 'Salvar Modelos de Mensagem'}
                </button>
              </div>
            </form>
          )}

          {/* Categoria: Equipe & Auxiliares */}
          {activeCategory === 'equipe' && (
            <div className={cardClass}>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold shadow-sm">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Equipe de Auxiliares</h3>
                  </div>
                </div>
              </div>

              {/* Lista da Equipe */}
              <div className="space-y-3 pt-2">
                {profissionais.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: p.cor_identificadora || '#8c52ff' }}>
                        {p.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.nome}</h4>
                        <p className="text-[10px] text-slate-400">{p.email}</p>
                      </div>
                    </div>

                    {p.cargo === 'auxiliar' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProfissional(p.id)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Remover auxiliar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
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
