import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api';
import { PaymentModal } from '../components/PaymentModal';
import { NewAppointmentModal } from '../components/NewAppointmentModal';
import {
  AlertCircle, ArrowRightLeft, Banknote, Calendar, CalendarDays, Check, CheckCircle, Clock, CreditCard, DollarSign,
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
  notes: 'bg-amber-500/10 text-amber-300 border-amber-500/25 hover:bg-amber-500/20',
  whatsapp: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20',
  maintenance: 'bg-purple-500/10 text-purple-300 border-purple-500/25 hover:bg-purple-500/20',
  payment: 'bg-teal-500/10 text-teal-300 border-teal-500/25 hover:bg-teal-500/20',
  transfer: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25 hover:bg-indigo-500/20',
  edit: 'bg-slate-500/10 text-slate-200 border-slate-500/25 hover:bg-slate-500/20',
  delete: 'bg-rose-500/10 text-rose-300 border-rose-500/25 hover:bg-rose-500/20'
};

const inputClass = 'w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500';

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl`}>
        <div className="mb-5 flex items-start justify-between border-b border-slate-800 pb-4">
          <div><h3 className="text-lg font-black text-white">{title}</h3>{subtitle && <p className="mt-1 text-xs font-semibold text-slate-400">{subtitle}</p>}</div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ActionButton({ kind, label, children, onClick }) {
  return <button type="button" onClick={onClick} title={label} aria-label={label} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${buttonStyles[kind]}`}>{children}</button>;
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

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3000); };

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

      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60 md:flex-row md:items-center">
        <div><span className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-500">Gestão inteligente</span><h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Próximos Compromissos</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Aceite agendamentos recebidos e gerencie cada atendimento.</p></div>
        <button onClick={openCreate} className="btn-animated inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/25"><Plus className="h-5 w-5" /> Novo Agendamento</button>
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
                className={`group p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border border-white/80 dark:border-slate-800/60 bg-white/72 dark:bg-slate-950/20 hover:bg-white/90 dark:hover:bg-slate-800/30 shadow-[0_14px_36px_rgba(15,23,42,0.08)] hover:shadow-[0_18px_44px_rgba(37,99,235,0.12)] backdrop-blur-sm transition-all rounded-3xl animate-fade-in ${
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
                      <ActionButton kind="edit" label="Editar agendamento" onClick={() => setModal({ type: 'edit', item })}>
                        <Edit3 className="h-4 w-4" />
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

      {modal?.type === 'details' && <Modal title="Detalhes do agendamento" subtitle={modal.item.cliente_nome || 'Cliente'} onClose={() => setModal(null)}><div className="space-y-3 text-sm text-slate-300"><div className="flex justify-between border-b border-slate-800 pb-2"><span>Serviço</span><strong className="text-white">{modal.item.servico_nome || 'Atendimento'}</strong></div><div className="flex justify-between border-b border-slate-800 pb-2"><span>Data e horário</span><strong className="text-white">{formatDate(modal.item.data_hora)} às {formatTime(modal.item.data_hora)}</strong></div><div className="flex justify-between border-b border-slate-800 pb-2"><span>Valor total</span><strong className="text-emerald-300">R$ {Number(modal.item.valor_total || 0).toFixed(2)}</strong></div><div className="flex justify-between border-b border-slate-800 pb-2"><span>Status</span><strong className="text-blue-300">{statusLabels[modal.item.status] || modal.item.status}</strong></div>{modal.item.observacao && <div className="rounded-2xl bg-slate-950 p-3 italic">“{modal.item.observacao}”</div>}</div><div className="mt-5 flex gap-2"><button onClick={() => setModal({ type: 'status', item: modal.item })} className="flex-1 rounded-2xl bg-blue-600 py-3 text-xs font-black text-white">Alterar status</button><button onClick={() => setModal({ type: 'edit', item: modal.item })} className="rounded-2xl bg-slate-800 px-4 py-3 text-xs font-black text-white">Editar</button></div></Modal>}

      {modal?.type === 'status' && <Modal title="Alterar status" subtitle={modal.item.cliente_nome} onClose={() => setModal(null)}><div className="grid gap-2">{[['agendado', 'Confirmado'], ['em_atendimento', 'Em Atendimento'], ['concluido', 'Já Atendido / Concluído'], ['manutencao', 'Agendar Manutenção Periódica'], ['cancelado', 'Cancelado / Recusado']].map(([value, label]) => <button key={value} onClick={() => updateAppointment(modal.item, { status: value }, `Status alterado para ${label}.`)} className={`rounded-2xl border p-4 text-left text-sm font-black ${selectedStatus === value ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-slate-800 text-slate-300 hover:bg-slate-800'}`}>{label}{selectedStatus === value && <Check className="float-right h-4 w-4" />}</button>)}</div></Modal>}

      {modal?.type === 'notes' && <Modal title="Observações do agendamento" subtitle={modal.item.cliente_nome} onClose={() => setModal(null)}><form onSubmit={event => { event.preventDefault(); updateAppointment(modal.item, { observacao: event.currentTarget.observacao.value.slice(0, 1000) }, 'Observação salva.'); }} className="space-y-4"><textarea name="observacao" defaultValue={modal.item.observacao || ''} maxLength="1000" rows="6" className={inputClass} placeholder="Registre uma observação para este atendimento..." /><div className="flex justify-end gap-2"><button type="button" onClick={() => setModal(null)} className="rounded-2xl px-4 py-3 text-xs font-bold text-slate-400">Cancelar</button><button className="rounded-2xl bg-amber-500 px-5 py-3 text-xs font-black text-slate-950">Salvar observação</button></div></form></Modal>}

      {modal?.type === 'maintenance' && <Modal title="Manutenção Periódica" subtitle={`${modal.item.cliente_nome || 'Cliente'} — ${modal.item.servico_nome || 'Atendimento'}`} onClose={() => setModal(null)}><form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); const date = `${data.get('date')}T${data.get('time')}`; apiRequest('/agendamentos', 'POST', { cliente_id: modal.item.cliente_id, profissional_id: modal.item.profissional_id, servico_id: modal.item.servico_id, data_hora: new Date(date).toISOString(), valor_total: modal.item.valor_total || 0, observacao: data.get('observacao'), status: 'agendado' }).then(() => { notify('Manutenção agendada.'); setModal(null); fetchAgenda(); }).catch(error => notify(error.message || 'Erro ao agendar manutenção.')); }} className="space-y-4"><div className="grid grid-cols-3 gap-2">{[15, 30, 45, 60, 90].map(days => <button type="button" key={days} onClick={event => { const date = new Date(modal.item.data_hora); date.setDate(date.getDate() + days); event.currentTarget.form.date.value = date.toISOString().slice(0, 10); }} className="rounded-xl border border-slate-700 px-2 py-3 text-xs font-black text-slate-300 hover:border-purple-500">{days} dias</button>)}</div><label className="block text-xs font-black uppercase text-slate-400">Data de retorno<input name="date" type="date" defaultValue={new Date(new Date(modal.item.data_hora).getTime() + 30 * 86400000).toISOString().slice(0, 10)} className={`${inputClass} mt-1`} required /></label><label className="block text-xs font-black uppercase text-slate-400">Horário<input name="time" type="time" defaultValue={formatTime(modal.item.data_hora)} className={`${inputClass} mt-1`} required /></label><textarea name="observacao" rows="3" className={inputClass} placeholder="Observações (opcional)" /><div className="flex justify-end gap-2"><button type="button" onClick={() => setModal(null)} className="rounded-2xl px-4 py-3 text-xs font-bold text-slate-400">Não agendar</button><button className="rounded-2xl bg-purple-600 px-5 py-3 text-xs font-black text-white">Confirmar e agendar</button></div></form></Modal>}

      {modal?.type === 'payment' && <Modal title="Pagamentos do agendamento" subtitle={modal.item.cliente_nome} onClose={() => setModal(null)}><div className="mb-4 rounded-2xl bg-slate-950 p-4"><div className="flex justify-between text-sm"><span className="text-slate-400">Valor do atendimento</span><strong className="text-white">R$ {Number(modal.item.valor_total || 0).toFixed(2)}</strong></div><div className="mt-2 flex justify-between text-sm"><span className="text-slate-400">Total registrado</span><strong className="text-emerald-300">R$ {payments.reduce((sum, payment) => sum + Number(payment.valor || 0), 0).toFixed(2)}</strong></div></div><div className="mb-5 space-y-2">{payments.length ? payments.map(payment => <div key={payment.id} className="flex justify-between rounded-xl border border-slate-800 p-3 text-xs"><span className="text-slate-300">{payment.forma_pagamento || 'Pagamento'}</span><strong className="text-emerald-300">R$ {Number(payment.valor).toFixed(2)}</strong></div>) : <p className="text-center text-xs text-slate-500">Nenhum pagamento registrado.</p>}</div><form onSubmit={event => recordPayment(event, modal.item)} className="space-y-3"><label className="block text-xs font-black uppercase text-slate-400">Valor<input name="valor" type="number" step="0.01" min="0" defaultValue={modal.item.valor_total || 0} className={`${inputClass} mt-1`} required /></label><label className="block text-xs font-black uppercase text-slate-400">Forma de pagamento<select name="forma_pagamento" className={`${inputClass} mt-1`}><option value="pix">Pix</option><option value="cartao">Cartão</option><option value="dinheiro">Dinheiro</option><option value="transferencia">Transferência</option></select></label><button className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white">Registrar pagamento</button></form></Modal>}

      {modal?.type === 'transfer' && <Modal title="Transferir agendamento" subtitle={modal.item.cliente_nome} onClose={() => setModal(null)}><div className="space-y-2">{profissionais.map(professional => <button key={professional.id} onClick={() => updateAppointment(modal.item, { profissional_id: professional.id }, `Agendamento transferido para ${professional.nome}.`)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 p-4 text-left text-sm font-black text-slate-200 hover:border-indigo-500"><User className="h-5 w-5 text-indigo-300" />{professional.nome}</button>)}{!profissionais.length && <p className="text-center text-sm text-slate-500">Nenhum profissional disponível.</p>}</div></Modal>}

      {modal?.type === 'edit' && <Modal title="Editar agendamento" subtitle={modal.item.cliente_nome} onClose={() => setModal(null)}><form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); updateAppointment(modal.item, { data_hora: new Date(data.get('data_hora')).toISOString(), observacao: data.get('observacao'), valor_total: Number(data.get('valor_total')), status: data.get('status') }, 'Agendamento atualizado.'); }} className="space-y-4"><label className="block text-xs font-black uppercase text-slate-400">Data e horário<input name="data_hora" type="datetime-local" defaultValue={new Date(modal.item.data_hora).toISOString().slice(0, 16)} className={`${inputClass} mt-1`} required /></label><label className="block text-xs font-black uppercase text-slate-400">Valor<input name="valor_total" type="number" step="0.01" defaultValue={modal.item.valor_total || 0} className={`${inputClass} mt-1`} /></label><label className="block text-xs font-black uppercase text-slate-400">Status<select name="status" defaultValue={modal.item.status} className={`${inputClass} mt-1`}>{Object.entries(statusLabels).filter(([key]) => !['aguardando_confirmacao', 'solicitado', 'confirmado', 'atendido', 'recusado'].includes(key)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><textarea name="observacao" rows="3" defaultValue={modal.item.observacao || ''} className={inputClass} placeholder="Observações" /><button className="w-full rounded-2xl bg-blue-600 py-3 text-xs font-black text-white">Salvar alterações</button></form></Modal>}

      {modal === 'create' && <Modal title="Novo Agendamento" subtitle="Preencha os dados do atendimento" onClose={() => setModal(null)}><form onSubmit={createAppointment} className="space-y-4"><label className="block text-xs font-black uppercase text-slate-400">Cliente<input value={form.cliente_nome} onChange={event => setForm({ ...form, cliente_nome: event.target.value, cliente_id: '' })} className={`${inputClass} mt-1`} placeholder="Nome do cliente" required /></label>{form.cliente_nome && filteredClients.length > 0 && <div className="max-h-28 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">{filteredClients.slice(0, 5).map(client => <button type="button" key={client.id} onClick={() => setForm({ ...form, cliente_id: client.id, cliente_nome: client.nome, cliente_whatsapp: client.whatsapp || '' })} className="block w-full px-3 py-2 text-left text-xs font-bold text-slate-300 hover:bg-slate-800">{client.nome}</button>)}</div>}<label className="block text-xs font-black uppercase text-slate-400">WhatsApp<input value={form.cliente_whatsapp} onChange={event => setForm({ ...form, cliente_whatsapp: event.target.value })} className={`${inputClass} mt-1`} placeholder="(11) 99999-9999" /></label><label className="block text-xs font-black uppercase text-slate-400">Serviço<select value={form.servico_id} onChange={event => setForm({ ...form, servico_id: event.target.value })} className={`${inputClass} mt-1`} required><option value="">Selecione um serviço</option>{servicos.map(service => <option key={service.id} value={service.id}>{service.nome} — R$ {Number(service.preco || 0).toFixed(2)}</option>)}</select></label><label className="block text-xs font-black uppercase text-slate-400">Data e horário<input value={form.data_hora} onChange={event => setForm({ ...form, data_hora: event.target.value })} type="datetime-local" className={`${inputClass} mt-1`} required /></label><textarea value={form.observacao} onChange={event => setForm({ ...form, observacao: event.target.value })} rows="3" className={inputClass} placeholder="Observações (opcional)" /><button className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-black text-white">Confirmar agendamento</button></form></Modal>}
    </div>
  );
}
