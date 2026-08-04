import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api';
import { gsap } from 'gsap';
import { PaymentModal } from '../components/PaymentModal';
import { NewAppointmentModal } from '../components/NewAppointmentModal';
import {
  Activity, AlertCircle, ArrowRightLeft, Banknote, Calendar, CalendarDays, Check, CheckCircle, ChevronDown, ChevronUp, Clock, CreditCard, DollarSign,
  Edit3, Info, Link, MessageSquare, Phone, Plus, QrCode, Scissors, ShieldCheck, Trash2, User,
  WalletCards, Wrench, X, Zap
} from 'lucide-react';

const filters = [
  ['todos', 'Todos'], ['hoje', 'Hoje'], ['solicitacoes', 'Solicitações'],
  ['agendado', 'Confirmados'], ['em_atendimento', 'Em Atendimento'],
  ['concluido', 'Atendidos'], ['manutencao', 'Manutenções'], ['cancelado', 'Cancelados']
];

const statusLabels = {
  aguardando_confirmacao: 'AGUARDANDO CONFIRMAÇÃO',
  solicitado: 'AGUARDANDO CONFIRMAÇÃO',
  agendado: 'CONFIRMADO',
  confirmado: 'CONFIRMADO',
  em_atendimento: 'EM ATENDIMENTO',
  concluido: 'JÁ ATENDIDO',
  atendido: 'JÁ ATENDIDO',
  manutencao: 'MANUTENÇÃO',
  cancelado: 'CANCELADO',
  recusado: 'RECUSADO'
};

const statusClasses = {
  aguardando_confirmacao: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  solicitado: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  agendado: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  confirmado: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  em_atendimento: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  concluido: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  atendido: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  manutencao: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  cancelado: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  recusado: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
};

const buttonStyles = {
  notes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 glow-amber',
  whatsapp: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 glow-green',
  maintenance: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20 glow-purple',
  payment: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 hover:bg-teal-500/20 glow-blue',
  transfer: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 glow-blue',
  edit: 'bg-slate-500/10 text-slate-700 dark:text-slate-200 border-slate-500/20 hover:bg-slate-500/20 glow-blue',
  delete: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20 glow-rose'
};

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-blue-500';

function formatDate(value) {
  return new Date(value).toLocaleDateString('pt-BR');
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function dateParts(value) {
  const date = new Date(value);
  return { month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), day: date.getDate() };
}

function Modal({ title, subtitle, children, onClose, wide = false }) {
  const modalRef = React.useRef(null);
  const overlayRef = React.useRef(null);

  React.useEffect(() => {
    gsap.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: 'power2.out' }
    );
    gsap.fromTo(modalRef.current,
      { scale: 0.92, opacity: 0, y: 15 },
      { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.4)', delay: 0.05 }
    );
  }, []);

  const handleClose = () => {
    gsap.to(modalRef.current, {
      scale: 0.94, opacity: 0, y: 10, duration: 0.2, ease: 'power2.in',
      onComplete: onClose
    });
    gsap.to(overlayRef.current, {
      opacity: 0, duration: 0.2, ease: 'power2.in'
    });
  };

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div ref={modalRef} className={`relative w-full ${wide ? 'max-w-xl' : 'max-w-md'} overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 sm:p-8`}>
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <header className="mb-5">
          <h2 className="text-xl font-black text-slate-950 dark:text-white leading-tight">{title}</h2>
          {subtitle && <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </header>
        {children}
      </div>
    </div>
  );
}

function ActionButton({ kind, label, children, onClick }) {
  return <button type="button" onClick={onClick} title={label} aria-label={label} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${buttonStyles[kind]}`}>{children}</button>;
}

function DetailsModal({ item, onClose, onUpdateStatus, onOpenMaintenance, onEditFull }) {
  const [selectedStatus, setSelectedStatus] = useState(item.status || 'agendado');
  const [saving, setSaving] = useState(false);

  const statusOptions = [
    { value: 'agendado', label: 'Confirmado', badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
    { value: 'em_atendimento', label: 'Em Atendimento', badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' },
    { value: 'concluido', label: 'Já Atendido / Concluído', badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
    { value: 'manutencao', label: 'Manutenção Periódica', badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' },
    { value: 'cancelado', label: 'Cancelado / Recusado', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' }
  ];

  const currentOption = statusOptions.find(o => o.value === selectedStatus) || statusOptions[0];

  const handleSave = async () => {
    if (selectedStatus === 'manutencao') {
      onClose();
      onOpenMaintenance(item);
      return;
    }

    setSaving(true);
    try {
      await onUpdateStatus(item, { status: selectedStatus }, `Status alterado para ${currentOption.label}.`);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Detalhes do agendamento" subtitle={item.cliente_nome || 'Cliente'} onClose={onClose}>
      <div className="space-y-3.5 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Serviço</span>
          <strong className="text-slate-900 dark:text-white font-bold">{item.servico_nome || 'Atendimento'}</strong>
        </div>
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Data e horário</span>
          <strong className="text-slate-900 dark:text-white font-bold">{formatDate(item.data_hora)} às {formatTime(item.data_hora)}</strong>
        </div>
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Valor total</span>
          <strong className="text-emerald-600 dark:text-emerald-400 font-black text-base">R$ {Number(item.valor_total || 0).toFixed(2)}</strong>
        </div>
        {item.observacao && (
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/50 p-3.5 italic text-slate-700 dark:text-slate-300 text-xs">
            “{item.observacao}”
          </div>
        )}
      </div>

      {/* Seção de Seleção de Status & Botão Salvar */}
      <div className="mt-6 space-y-2.5">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Status do Agendamento
        </label>
        
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`w-full appearance-none rounded-2xl border px-4 py-3.5 pr-10 text-xs font-extrabold outline-none transition-all cursor-pointer shadow-sm ${currentOption.badgeClass}`}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold py-2">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70" />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-animated flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-3.5 text-xs font-black text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 shrink-0"
          >
            {saving ? (
              'Salvando...'
            ) : (
              <>
                <Check className="h-4 w-4 stroke-[3px]" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/50 flex justify-center">
        <button
          type="button"
          onClick={() => onEditFull(item)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <Edit3 className="h-3.5 w-3.5" /> Editar horário ou valor completo
        </button>
      </div>
    </Modal>
  );
}

export function Agenda() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('hoje');
  const [modal, setModal] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentDraft, setPaymentDraft] = useState({ gross: '', discount: '0.00', condition: 'a_vista', method: 'pix', status: 'pago', notes: '' });
  const [toast, setToast] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [form, setForm] = useState({ cliente_id: '', cliente_nome: '', cliente_whatsapp: '', servico_id: '', data_hora: `${new Date().toISOString().slice(0, 10)}T18:40`, observacao: '' });
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);
  const [statsOpen, setStatsOpen] = useState(false);

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3000); };

  // Animação em cascata (stagger) dos cards de agendamento usando GSAP
  useEffect(() => {
    if (!loading && agendamentos.length > 0) {
      gsap.fromTo('.appointment-card',
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.05, ease: 'power2.out', overwrite: 'auto' }
      );
    }
  }, [loading, activeFilter, agendamentos]);

  // Animação de pulsação nos contadores estatísticos quando o Accordion abre
  useEffect(() => {
    if (statsOpen) {
      gsap.fromTo('.stat-card',
        { opacity: 0, scale: 0.92, y: -8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'back.out(1.4)', overwrite: 'auto' }
      );
    }
  }, [statsOpen]);

  async function fetchTodosAgendamentos() {
    try {
      const result = await apiRequest('/agendamentos');
      setTodosAgendamentos(result.agendamentos || []);
    } catch (err) {
      console.error('Erro ao buscar todos agendamentos para os contadores:', err);
    }
  }

  const stats = useMemo(() => {
    let solicitados = 0;
    let confirmados = 0;
    let concluidos = 0;
    let cancelados = 0;

    todosAgendamentos.forEach(item => {
      const status = item.status?.toLowerCase();
      if (status === 'aguardando_confirmacao' || status === 'solicitado') {
        solicitados++;
      } else if (status === 'agendado' || status === 'confirmado' || status === 'em_atendimento') {
        confirmados++;
      } else if (status === 'concluido' || status === 'atendido') {
        concluidos++;
      } else if (status === 'cancelado' || status === 'recusado') {
        cancelados++;
      }
    });

    return { solicitados, confirmados, concluidos, cancelados };
  }, [todosAgendamentos]);

  async function fetchAgenda() {
    setLoading(true);
    try {
      let query = '';
      if (activeFilter === 'hoje') {
        const today = new Date().toISOString().slice(0, 10);
        query = `?data_inicio=${today}T00:00:00.000Z&data_fim=${today}T23:59:59.999Z`;
      } else if (activeFilter === 'solicitacoes') query = '?status=aguardando_confirmacao';
      else if (activeFilter !== 'todos') query = `?status=${activeFilter}`;
      const result = await apiRequest(`/agendamentos${query}`);
      setAgendamentos(result.agendamentos || []);
      fetchTodosAgendamentos();
    } catch (error) { notify(error.message || 'Não foi possível carregar a agenda.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchAgenda(); }, [activeFilter]);

  async function openCreate() {
    try {
      const [clients, services] = await Promise.all([apiRequest('/clientes'), apiRequest('/servicos')]);
      setClientes(clients.clientes || []); setServicos(services.servicos || []); setModal('create-new');
    } catch (error) { notify(error.message || 'Erro ao carregar dados.'); }
  }

  async function openTransfer(item) {
    try { const result = await apiRequest('/profissionais'); setProfissionais(result.profissionais || []); setModal({ type: 'transfer', item }); }
    catch (error) { notify(error.message || 'Erro ao carregar profissionais.'); }
  }

  async function openPayment(item) {
    try {
      const result = await apiRequest('/caixa');
      const itemPayments = (result.movimentacoes || []).filter(m => Number(m.agendamento_id) === Number(item.id));
      const current = itemPayments[0];
      setPayments(itemPayments);
      setPaymentDraft({ gross: String(current?.valor ?? item.valor_total ?? 0), discount: String(current?.desconto ?? '0.00'), condition: current?.condicao_pagamento || 'a_vista', method: current?.forma_pagamento || 'pix', status: current?.status_pagamento || current?.status || 'pago', notes: current?.observacoes || '' });
      setModal({ type: 'payment-new', item });
    }
    catch (error) { notify(error.message || 'Erro ao carregar pagamentos.'); }
  }

  async function updateAppointment(item, data, message) {
    try { await apiRequest(`/agendamentos/${item.id}`, 'PUT', data); notify(message); setModal(null); await fetchAgenda(); }
    catch (error) { notify(error.message || 'Não foi possível atualizar o agendamento.'); }
  }

  async function createAppointment(event) {
    event.preventDefault();
    try {
      const service = servicos.find(s => Number(s.id) === Number(form.servico_id));
      let clientId = form.cliente_id;
      if (!clientId && form.cliente_nome) { const result = await apiRequest('/clientes', 'POST', { nome: form.cliente_nome, whatsapp: form.cliente_whatsapp }); clientId = result.cliente?.id; }
      await apiRequest('/agendamentos', 'POST', { cliente_id: clientId, servico_id: Number(form.servico_id), data_hora: new Date(form.data_hora).toISOString(), valor_total: service?.preco || 0, observacao: form.observacao, status: 'agendado' });
      setModal(null); notify('Agendamento criado.'); fetchAgenda();
    } catch (error) { notify(error.message || 'Erro ao criar agendamento.'); }
  }

  async function recordPayment(event, item) {
    event.preventDefault();
    try {
      const gross = Number(paymentDraft.gross || 0);
      const discount = Number(paymentDraft.discount || 0);
      await apiRequest('/caixa', 'POST', { agendamento_id: item.id, tipo: 'entrada', descricao: paymentDraft.notes || `Pagamento — ${item.cliente_nome || 'cliente'}`, valor: Math.max(0, gross - discount), status: paymentDraft.status === 'pago' ? 'pago' : 'a_receber', forma_pagamento: paymentDraft.method });
      notify('Pagamento registrado.'); await openPayment(item);
    } catch (error) { notify(error.message || 'Erro ao registrar pagamento.'); }
  }

  async function removeAppointment(item) {
    if (!window.confirm('Deseja excluir este agendamento?')) return;
    try { await apiRequest(`/agendamentos/${item.id}`, 'DELETE'); notify('Agendamento excluído.'); fetchAgenda(); }
    catch (error) { notify(error.message || 'Erro ao excluir agendamento.'); }
  }

  const filteredClients = useMemo(() => clientes.filter(c => (c.nome || '').toLowerCase().includes(clientSearch.toLowerCase())), [clientes, clientSearch]);
  const selectedStatus = modal?.item?.status;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {modal?.type === 'payment-new' && <PaymentModal item={modal.item} payments={payments} draft={paymentDraft} setDraft={setPaymentDraft} onClose={() => setModal(null)} onSubmit={event => recordPayment(event, modal.item)} onOnline={() => notify('Configure o Asaas em Parâmetros para gerar cobranças online.')} />}
      {modal === 'create-new' && <NewAppointmentModal form={form} setForm={setForm} clients={filteredClients} services={servicos} onClose={() => setModal(null)} onSubmit={createAppointment} />}
      {toast && <div className="fixed right-5 top-5 z-[70] rounded-2xl border border-emerald-500/30 bg-slate-900 px-5 py-3 text-sm font-bold text-emerald-300 shadow-2xl">{toast}</div>}

      <div className="flex items-center justify-between w-full p-1">
        <div>
          <span className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-500">Gestão inteligente</span>
          <h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">Agenda</h1>
        </div>
        <button onClick={openCreate} className="btn-animated inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/25 shrink-0"><Plus className="h-5 w-5" /> <span className="hidden sm:inline">Novo Agendamento</span><span className="inline sm:hidden">Novo</span></button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/60 shadow-xl backdrop-blur-xl overflow-hidden w-full transition-all">
        <div 
          onClick={() => setStatsOpen(!statsOpen)} 
          className="flex items-center justify-between p-5 cursor-pointer select-none"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-500">Visão Geral</span>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">Indicadores de Hoje</h2>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50/80 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
            {statsOpen ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
          </div>
        </div>

        {statsOpen && (
          <div className="border-t border-slate-100 dark:border-slate-800/60 p-5 bg-slate-50/20 dark:bg-slate-950/10">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 w-full">
              <div className="stat-card rounded-2xl border border-slate-100 dark:border-slate-800/85 bg-white dark:bg-slate-950/40 p-4 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">Solicitados</span>
                <span className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white">{stats.solicitados}</span>
              </div>

              <div className="stat-card rounded-2xl border border-slate-100 dark:border-slate-800/85 bg-white dark:bg-slate-950/40 p-4 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">Confirmados</span>
                <span className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white">{stats.confirmados}</span>
              </div>

              <div className="stat-card rounded-2xl border border-slate-100 dark:border-slate-800/85 bg-white dark:bg-slate-950/40 p-4 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Atendidos</span>
                <span className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white">{stats.concluidos}</span>
              </div>

              <div className="stat-card rounded-2xl border border-slate-100 dark:border-slate-800/85 bg-white dark:bg-slate-950/40 p-4 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">Cancelados</span>
                <span className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white">{stats.cancelados}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">{filters.map(([key, label]) => <button key={key} onClick={() => setActiveFilter(key)} className={`whitespace-nowrap rounded-2xl border px-4 py-2 text-xs font-extrabold transition ${activeFilter === key ? 'border-blue-500 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20' : 'border-slate-200 bg-white/80 text-slate-500 hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400'}`}>{label}</button>)}</div>

      {loading ? (
        <div className="py-16 text-center text-sm font-semibold text-slate-400">Carregando compromissos...</div>
      ) : agendamentos.length === 0 ? (
        <div className="rounded-3xl border border-slate-300/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 p-12 text-center text-slate-400">
          <Calendar className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Nenhum compromisso encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agendamentos.map(item => {
            const parts = dateParts(item.data_hora);
            const isRequest = ['aguardando_confirmacao', 'solicitado'].includes(item.status);
            const isManutencao = item.status === 'manutencao';
            const isAtendimentoExterno = (item.tipo_atendimento || 'salao').toLowerCase() === 'cliente' || (item.tipo_atendimento || 'salao').toLowerCase() === 'externo';
            
            return (
              <div
                key={item.id}
                className={`appointment-card group p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border border-white/80 dark:border-slate-800/60 bg-white/72 dark:bg-slate-950/20 hover:bg-white/90 dark:hover:bg-slate-800/30 shadow-[0_14px_36px_rgba(15,23,42,0.08)] hover:shadow-[0_18px_44px_rgba(37,99,235,0.12)] backdrop-blur-sm transition-all rounded-3xl ${
                  isManutencao ? 'ring-1 ring-purple-200/70 dark:ring-purple-500/15' : ''
                }`}
                onClick={() => setModal({ type: 'details', item })}
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl font-bold ${
                      isManutencao
                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40'
                        : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase">{parts.month}</span>
                    <span className="text-sm font-extrabold leading-none">{parts.day}</span>
                  </div>
                  
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {item.cliente_nome || 'Cliente não identificado'}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          statusClasses[item.status] || statusClasses.agendado
                        }`}
                      >
                        {statusLabels[item.status] || item.status}
                      </span>
                      
                      {item.profissional_nome && (
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full text-white shadow-sm shrink-0"
                          style={{ backgroundColor: item.profissional_cor || '#8b5cf6' }}
                        >
                          <User className="h-2.5 w-2.5 shrink-0" /> {item.profissional_nome}
                        </span>
                      )}
                      
                      {isAtendimentoExterno ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-300 border border-orange-500/20 shrink-0">
                          No local do cliente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-300 border border-slate-500/20 shrink-0">
                          No salão
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <Scissors className="h-3.5 w-3.5 text-blue-400" />
                      {item.servico_nome || 'Atendimento'}{' '}
                      <span className="font-semibold text-slate-400">({item.duracao_total_minutos || 60} min)</span>
                    </div>
                    
                    <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                      <span>
                        <Clock className="mr-1 inline h-3 w-3" />
                        {formatTime(item.data_hora)}
                      </span>
                      <span>
                        <CalendarDays className="mr-1 inline h-3 w-3" />
                        {formatDate(item.data_hora)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-end gap-1.5" onClick={event => event.stopPropagation()}>
                  {isRequest ? (
                    <>
                      <button
                        onClick={() => updateAppointment(item, { status: 'agendado' }, 'Solicitação aceita.')}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => updateAppointment(item, { status: 'recusado' }, 'Solicitação recusada.')}
                        className="rounded-xl bg-rose-500/15 px-3 py-2 text-xs font-black text-rose-300"
                      >
                        Recusar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => updateAppointment(item, { status: 'em_atendimento' }, 'Atendimento iniciado.')}
                        className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black text-white"
                      >
                        Iniciar
                      </button>
                      <button
                        onClick={() => updateAppointment(item, { status: 'concluido' }, 'Atendimento concluído.')}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white"
                      >
                        Concluir
                      </button>
                      <ActionButton kind="notes" label="Registrar observação" onClick={() => setModal({ type: 'notes', item })}>
                        <MessageSquare className="h-4 w-4" />
                      </ActionButton>
                      {item.cliente_whatsapp && (
                        <a
                          href={`https://wa.me/55${item.cliente_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Olá ${item.cliente_nome || ''}, confirmamos seu agendamento para ${formatDate(
                              item.data_hora
                            )} às ${formatTime(item.data_hora)}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${buttonStyles.whatsapp}`}
                          title="Enviar WhatsApp"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      <ActionButton kind="maintenance" label="Agendar manutenção" onClick={() => setModal({ type: 'maintenance', item })}>
                        <Wrench className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton kind="payment" label="Registrar / ver pagamentos" onClick={() => openPayment(item)}>
                        <DollarSign className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton kind="transfer" label="Transferir agendamento" onClick={() => openTransfer(item)}>
                        <ArrowRightLeft className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton kind="delete" label="Excluir agendamento" onClick={() => removeAppointment(item)}>
                        <Trash2 className="h-4 w-4" />
                      </ActionButton>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal?.type === 'details' && (
        <DetailsModal
          item={modal.item}
          onClose={() => setModal(null)}
          onUpdateStatus={updateAppointment}
          onOpenMaintenance={(item) => setModal({ type: 'maintenance', item })}
          onEditFull={(item) => setModal({ type: 'edit', item })}
        />
      )}

      {modal?.type === 'status' && (
        <Modal title={modal.item.cliente_nome} subtitle={modal.item.cliente_whatsapp} onClose={() => setModal(null)}>
          <div className="grid gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {[
              ['agendado', 'Confirmado'],
              ['em_atendimento', 'Em Atendimento'],
              ['concluido', 'Já Atendido / Concluído'],
              ['manutencao', 'Agendar Manutenção Periódica'],
              ['cancelado', 'Cancelado / Recusado']
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => updateAppointment(modal.item, { status: value }, `Status alterado para ${label}.`)}
                className={`rounded-2xl border p-4 text-left text-sm font-black transition-all ${
                  selectedStatus === value
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-500/5'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                }`}
              >
                {label}
                {selectedStatus === value && <Check className="float-right h-4 w-4 text-blue-600 dark:text-blue-400" />}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {modal?.type === 'notes' && (
        <Modal title="Observações do agendamento" subtitle={modal.item.cliente_nome} onClose={() => setModal(null)}>
          <form onSubmit={event => { event.preventDefault(); updateAppointment(modal.item, { observacao: event.currentTarget.observacao.value.slice(0, 1000) }, 'Observação salva.'); }} className="space-y-4">
            <textarea name="observacao" defaultValue={modal.item.observacao || ''} maxLength="1000" rows="6" className={inputClass} placeholder="Registre uma observação para este atendimento..." />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="btn-animated rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">Cancelar</button>
              <button className="btn-animated rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-xs font-black text-white shadow-lg shadow-blue-500/20">Salvar observação</button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === 'maintenance' && (
        <Modal title="Manutenção Periódica" subtitle={`${modal.item.cliente_nome || 'Cliente'} — ${modal.item.servico_nome || 'Atendimento'}`} onClose={() => setModal(null)}>
          <form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); const date = `${data.get('date')}T${data.get('time')}`; apiRequest('/agendamentos', 'POST', { cliente_id: modal.item.cliente_id, profissional_id: modal.item.profissional_id, servico_id: modal.item.servico_id, data_hora: new Date(date).toISOString(), valor_total: modal.item.valor_total || 0, observacao: data.get('observacao'), status: 'agendado' }).then(() => { notify('Manutenção agendada.'); setModal(null); fetchAgenda(); }).catch(error => notify(error.message || 'Erro ao agendar manutenção.')); }} className="space-y-4">
            <div className="grid grid-cols-5 gap-1.5 w-full">
              {[15, 30, 45, 60, 90].map(days => (
                <button type="button" key={days} onClick={event => { const date = new Date(modal.item.data_hora); date.setDate(date.getDate() + days); event.currentTarget.form.date.value = date.toISOString().slice(0, 10); }} className="btn-animated rounded-xl border border-slate-200 hover:border-purple-500 py-2.5 text-center text-xs font-black text-slate-700 dark:border-slate-800 dark:text-slate-300 dark:hover:border-purple-500">{days}d</button>
              ))}
            </div>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              Data de retorno
              <input name="date" type="date" defaultValue={new Date(new Date(modal.item.data_hora).getTime() + 30 * 86400000).toISOString().slice(0, 10)} className={`${inputClass} mt-1`} required />
            </label>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              Horário
              <input name="time" type="time" defaultValue={formatTime(modal.item.data_hora)} className={`${inputClass} mt-1`} required />
            </label>
            <textarea name="observacao" rows="3" className={inputClass} placeholder="Observações (opcional)" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="btn-animated rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">Não agendar</button>
              <button className="btn-animated rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-xs font-black text-white shadow-lg shadow-purple-500/20">Confirmar e agendar</button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === 'payment' && (
        <Modal title="Pagamentos do agendamento" subtitle={modal.item.cliente_nome} onClose={() => setModal(null)}>
          <div className="mb-4 rounded-2xl bg-slate-50 border border-slate-200/60 dark:bg-slate-950 p-4">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Valor do atendimento</span><strong className="text-slate-900 dark:text-white">R$ {Number(modal.item.valor_total || 0).toFixed(2)}</strong></div>
            <div className="mt-2 flex justify-between text-sm"><span className="text-slate-500">Total registrado</span><strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">R$ {payments.reduce((sum, payment) => sum + Number(payment.valor || 0), 0).toFixed(2)}</strong></div>
          </div>
          <div className="mb-5 space-y-2 max-h-[25vh] overflow-y-auto pr-1">
            {payments.length ? payments.map(payment => (
              <div key={payment.id} className="flex justify-between rounded-xl border border-slate-200 dark:border-slate-800/80 p-3 text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">{payment.forma_pagamento?.toUpperCase() || 'PAGAMENTO'}</span>
                <strong className="text-emerald-600 dark:text-emerald-400">R$ {Number(payment.valor).toFixed(2)}</strong>
              </div>
            )) : <p className="text-center text-xs text-slate-400 font-medium">Nenhum pagamento registrado.</p>}
          </div>
          <form onSubmit={event => recordPayment(event, modal.item)} className="space-y-3.5">
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Valor<input name="valor" type="number" step="0.01" min="0" defaultValue={modal.item.valor_total || 0} className={`${inputClass} mt-1`} required /></label>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Forma de pagamento<select name="forma_pagamento" className={`${inputClass} mt-1`}><option value="pix">Pix</option><option value="cartao">Cartão</option><option value="dinheiro">Dinheiro</option><option value="transferencia">Transferência</option></select></label>
            <button className="btn-animated w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-500/10">Registrar pagamento</button>
          </form>
        </Modal>
      )}

      {modal?.type === 'transfer' && (
        <Modal title="Transferir agendamento" subtitle={modal.item.cliente_nome} onClose={() => setModal(null)}>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {profissionais.map(professional => (
              <button key={professional.id} onClick={() => updateAppointment(modal.item, { profissional_id: professional.id }, `Agendamento transferido para ${professional.nome}.`)} className="btn-animated flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white/50 hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 p-4 text-left text-sm font-black text-slate-700 dark:text-slate-200"><User className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />{professional.nome}</button>
            ))}
            {!profissionais.length && <p className="text-center text-sm text-slate-400 font-medium">Nenhum profissional disponível.</p>}
          </div>
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Editar agendamento" subtitle={modal.item.cliente_nome} onClose={() => setModal(null)}>
          <form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); updateAppointment(modal.item, { data_hora: new Date(data.get('data_hora')).toISOString(), observacao: data.get('observacao'), valor_total: Number(data.get('valor_total')), status: data.get('status') }, 'Agendamento atualizado.'); }} className="space-y-4">
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Data e horário
              <input name="data_hora" type="datetime-local" defaultValue={new Date(modal.item.data_hora).toISOString().slice(0, 16)} className={`${inputClass} mt-1`} required />
            </label>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Valor
              <input name="valor_total" type="number" step="0.01" defaultValue={modal.item.valor_total || 0} className={`${inputClass} mt-1`} />
            </label>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Status
              <select name="status" defaultValue={modal.item.status} className={`${inputClass} mt-1`}>
                {Object.entries(statusLabels).filter(([key]) => !['aguardando_confirmacao', 'solicitado', 'confirmado', 'atendido', 'recusado'].includes(key)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            <textarea name="observacao" rows="3" defaultValue={modal.item.observacao || ''} className={inputClass} placeholder="Observações" />
            <button className="btn-animated w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-black text-white shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700">Salvar alterações</button>
          </form>
        </Modal>
      )}

      {modal === 'create' && (
        <Modal title="Novo Agendamento" subtitle="Preencha os dados do atendimento" onClose={() => setModal(null)}>
          <form onSubmit={createAppointment} className="space-y-4">
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Cliente
              <input value={form.cliente_nome} onChange={event => setForm({ ...form, cliente_nome: event.target.value, cliente_id: '' })} className={`${inputClass} mt-1`} placeholder="Nome do cliente" required />
            </label>
            {form.cliente_nome && filteredClients.length > 0 && (
              <div className="max-h-28 overflow-y-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                {filteredClients.slice(0, 5).map(client => (
                  <button type="button" key={client.id} onClick={() => setForm({ ...form, cliente_id: client.id, cliente_nome: client.nome, cliente_whatsapp: client.whatsapp || '' })} className="block w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{client.nome}</button>
                ))}
              </div>
            )}
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">WhatsApp
              <input value={form.cliente_whatsapp} onChange={event => setForm({ ...form, cliente_whatsapp: event.target.value })} className={`${inputClass} mt-1`} placeholder="(11) 99999-9999" />
            </label>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Serviço
              <select value={form.servico_id} onChange={event => setForm({ ...form, servico_id: event.target.value })} className={`${inputClass} mt-1`} required>
                <option value="">Selecione um serviço</option>
                {servicos.map(service => <option key={service.id} value={service.id}>{service.nome} — R$ {Number(service.preco || 0).toFixed(2)}</option>)}
              </select>
            </label>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Data e horário
              <input value={form.data_hora} onChange={event => setForm({ ...form, data_hora: event.target.value })} type="datetime-local" className={`${inputClass} mt-1`} required />
            </label>
            <textarea value={form.observacao} onChange={event => setForm({ ...form, observacao: event.target.value })} rows="3" className={inputClass} placeholder="Observações (opcional)" />
            <button className="btn-animated w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-black text-white shadow-lg shadow-blue-500/25">Confirmar agendamento</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
