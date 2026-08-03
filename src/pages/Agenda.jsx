import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Plus, Calendar, Clock, User, CheckCircle, AlertCircle, Phone, DollarSign, Edit, Trash2, Shield, Search, X } from 'lucide-react';

export function Agenda() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('hoje');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [form, setForm] = useState({
    cliente_nome: '',
    cliente_whatsapp: '',
    servico_id: '',
    data_hora: `${new Date().toISOString().split('T')[0]}T18:40`,
    observacao: '',
  });

  useEffect(() => {
    fetchAgenda();
  }, [activeFilter]);

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      let query = '';
      if (activeFilter === 'hoje') {
        const today = new Date().toISOString().split('T')[0];
        query = `?data_inicio=${today}T00:00:00.000Z&data_fim=${today}T23:59:59.999Z`;
      } else if (activeFilter !== 'todos') {
        query = `?status=${activeFilter}`;
      }
      const res = await apiRequest(`/agendamentos${query}`);
      setAgendamentos(res.agendamentos || []);
    } catch (err) {
      console.error('[AGENDA ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async () => {
    try {
      const cRes = await apiRequest('/clientes');
      const sRes = await apiRequest('/servicos');
      setClientes(cRes.clientes || []);
      setServicos(sRes.servicos || []);
      setShowModal(true);
    } catch (err) {
      alert('Erro ao carregar serviços.');
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      const serv = servicos.find(s => s.id === parseInt(form.servico_id, 10));

      // Find or create customer
      let clienteId = null;
      if (form.cliente_nome) {
        const cRes = await apiRequest('/clientes', 'POST', {
          nome: form.cliente_nome,
          whatsapp: form.cliente_whatsapp
        }).catch(() => null);
        if (cRes?.cliente) clienteId = cRes.cliente.id;
      }

      await apiRequest('/agendamentos', 'POST', {
        cliente_id: clienteId,
        servico_id: parseInt(form.servico_id, 10),
        data_hora: new Date(form.data_hora).toISOString(),
        valor_total: serv ? serv.preco : 0,
        observacao: form.observacao,
        status: 'agendado',
      });
      setShowModal(false);
      fetchAgenda();
    } catch (err) {
      alert(err.message || 'Erro ao criar agendamento.');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await apiRequest(`/agendamentos/${id}`, 'PUT', { status });
      fetchAgenda();
    } catch (err) {
      alert('Erro ao atualizar status.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja cancelar/excluir este agendamento?')) return;
    try {
      await apiRequest(`/agendamentos/${id}`, 'DELETE');
      fetchAgenda();
    } catch (err) {
      alert('Erro ao excluir agendamento.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner Card */}
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            GESTÃO INTELIGENTE
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Próximos Compromissos
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Aceite agendamentos recebidos e gerencie cada atendimento.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="btn-animated inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-500/25"
        >
          <Plus className="h-4 w-4" /> Novo Agendamento
        </button>
      </div>

      {/* Notification Banner */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 flex items-center justify-between gap-3 text-xs font-semibold text-blue-700 dark:text-blue-300">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-blue-500 shrink-0" />
          <div>
            <strong className="block font-bold">Notificações com Navegador Fechado (Android & iPhone)</strong>
            <span>No Android e no iPhone, instale como PWA e ative as notificações em Parâmetros.</span>
          </div>
        </div>
      </div>

      {/* Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {['todos', 'hoje', 'aguardando_confirmacao', 'agendado', 'em_atendimento', 'concluido', 'cancelado'].map((filterKey) => {
          const labels = {
            todos: 'Todos',
            hoje: 'Hoje',
            aguardando_confirmacao: 'Solicitações',
            agendado: 'Confirmados',
            em_atendimento: 'Em Atendimento',
            concluido: 'Atendidos',
            cancelado: 'Cancelados'
          };
          const isActive = activeFilter === filterKey;
          return (
            <button
              key={filterKey}
              onClick={() => setActiveFilter(filterKey)}
              className={`filter-btn whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-extrabold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-200/70 text-slate-600 hover:bg-slate-300 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {labels[filterKey]}
            </button>
          );
        })}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando compromissos...</div>
      ) : agendamentos.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900/40">
          <Calendar className="mx-auto h-12 w-12 opacity-30 mb-3" />
          <p className="font-semibold text-sm">Nenhum compromisso encontrado neste filtro.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agendamentos.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-lg backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 flex flex-col items-center justify-center text-center shrink-0">
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {new Date(item.data_hora).toLocaleString('default', { month: 'short' })}
                  </span>
                  <span className="text-base font-black leading-none">
                    {new Date(item.data_hora).getDate()}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {item.cliente_nome || 'Cliente sem nome'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      item.status === 'concluido' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      item.status === 'aguardando_confirmacao' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {item.status === 'aguardando_confirmacao' ? 'Solicitação' : item.status}
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {item.profissional_nome || 'Patricia'}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    ✂️ {item.servico_nome || 'Atendimento'} ({item.duracao_total_minutos || 60} min)
                  </div>

                  <div className="mt-1 text-[11px] font-semibold text-slate-400 flex items-center gap-3">
                    <span>🕒 {new Date(item.data_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>📅 {new Date(item.data_hora).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {item.cliente_whatsapp && (
                  <a
                    href={`https://wa.me/55${item.cliente_whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 transition"
                    title="Enviar WhatsApp"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                )}

                <button
                  onClick={() => handleStatusChange(item.id, 'concluido')}
                  className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center hover:bg-blue-500/20 transition"
                  title="Concluir Atendimento"
                >
                  <DollarSign className="h-4 w-4" />
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500/20 transition"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar Agendamento (Idêntico ao Screenshot 3) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Novo Agendamento</h3>
                  <p className="text-[11px] font-semibold text-slate-400">Horários validados pelo expediente</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">NOME DO CLIENTE</label>
                </div>
                <input
                  type="text"
                  value={form.cliente_nome}
                  onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })}
                  placeholder="Ex: João Silva"
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">WHATSAPP DO CLIENTE</label>
                <input
                  type="text"
                  value={form.cliente_whatsapp}
                  onChange={(e) => setForm({ ...form, cliente_whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">SERVIÇO DESEJADO</label>
                <select
                  value={form.servico_id}
                  onChange={(e) => setForm({ ...form, servico_id: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500"
                >
                  <option value="">Selecione um serviço...</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome} — R$ {parseFloat(s.preco).toFixed(2)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">DATA DO ATENDIMENTO</label>
                <input
                  type="datetime-local"
                  value={form.data_hora}
                  onChange={(e) => setForm({ ...form, data_hora: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">OBSERVAÇÕES (OPCIONAL)</label>
                <textarea
                  rows="2"
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  placeholder="Ex: Cliente prefere confirmação por mensagem..."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-animated px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-black text-white shadow-lg shadow-blue-500/25"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
