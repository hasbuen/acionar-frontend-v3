import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Users, UserPlus, Search, Phone, History, Edit, Trash2, X, Calendar, MessageSquare } from 'lucide-react';

export function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [historyCliente, setHistoryCliente] = useState(null);
  const [historyAgendamentos, setHistoryAgendamentos] = useState([]);

  const [form, setForm] = useState({
    nome: '',
    whatsapp: '',
    email: '',
    observacoes: '',
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/clientes');
      setClientes(res.clientes || []);
    } catch (err) {
      console.error('[CLIENTES ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente);
      setForm({
        nome: cliente.nome,
        whatsapp: cliente.whatsapp || '',
        email: cliente.email || '',
        observacoes: cliente.observacoes || '',
      });
    } else {
      setEditingCliente(null);
      setForm({ nome: '', whatsapp: '', email: '', observacoes: '' });
    }
    setShowModal(true);
  };

  const handleSaveCliente = async (e) => {
    e.preventDefault();
    try {
      if (editingCliente) {
        await apiRequest(`/clientes/${editingCliente.id}`, 'PUT', form);
      } else {
        await apiRequest('/clientes', 'POST', form);
      }
      setShowModal(false);
      fetchClientes();
    } catch (err) {
      alert(err.message || 'Erro ao salvar cliente.');
    }
  };

  const handleDeleteCliente = async (id) => {
    if (!confirm('Deseja realmente remover este cliente?')) return;
    try {
      await apiRequest(`/clientes/${id}`, 'DELETE');
      fetchClientes();
    } catch (err) {
      alert('Erro ao remover cliente.');
    }
  };

  const handleViewHistory = async (cliente) => {
    setHistoryCliente(cliente);
    try {
      const res = await apiRequest(`/agendamentos?cliente_id=${cliente.id}`);
      setHistoryAgendamentos(res.agendamentos || []);
    } catch (err) {
      setHistoryAgendamentos([]);
    }
  };

  const filteredClientes = clientes.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.whatsapp?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Banner Superior */}
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            BASE DE DADOS
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Lista de Clientes
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Visualize e gerencie os contatos cadastrados no sistema ({clientes.length} clientes).
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="btn-animated inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-500/25"
        >
          <UserPlus className="h-4 w-4" /> Novo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente por nome, WhatsApp ou e-mail..."
          className="w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-4 py-3.5 text-xs font-bold text-slate-900 shadow-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-white"
        />
      </div>

      {/* Grid de Clientes */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando clientes...</div>
      ) : filteredClientes.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900/40">
          <Users className="mx-auto h-12 w-12 opacity-30 mb-3" />
          <p className="font-semibold text-sm">Nenhum cliente cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClientes.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-lg backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60 flex flex-col justify-between gap-4 animate-fade-in"
            >
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                  {c.nome[0]?.toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-base font-black text-slate-900 dark:text-white truncate">{c.nome}</h3>
                  {c.whatsapp && (
                    <p className="text-xs font-semibold text-slate-400 mt-0.5 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-emerald-400" /> {c.whatsapp}
                    </p>
                  )}
                  {c.email && (
                    <p className="text-xs text-slate-400 truncate">{c.email}</p>
                  )}
                </div>
              </div>

              {c.observacoes && (
                <p className="text-xs italic text-slate-400 line-clamp-2 bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  "{c.observacoes}"
                </p>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
                {c.whatsapp ? (
                  <a
                    href={`https://wa.me/55${c.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                ) : <div />}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleViewHistory(c)}
                    className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                    title="Histórico"
                  >
                    <History className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenModal(c)}
                    className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-400 hover:text-blue-300 flex items-center justify-center"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCliente(c.id)}
                    className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-400 hover:text-rose-300 flex items-center justify-center"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo / Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white">
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCliente} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">NOME COMPLETO</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Fernanda Silva"
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">WHATSAPP</label>
                <input
                  type="text"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="(11) 98765-4321"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">E-MAIL</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="fernanda@gmail.com"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">OBSERVAÇÕES / PREFERÊNCIAS</label>
                <textarea
                  rows="2"
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  placeholder="Preferências, alergias, formato..."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="px-6 py-3 rounded-2xl bg-blue-600 text-xs font-black text-white shadow-lg shadow-blue-500/25">
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Histórico do Cliente */}
      {historyCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white">Histórico de Atendimentos</h3>
                <p className="text-xs text-blue-400 font-bold">{historyCliente.nome}</p>
              </div>
              <button onClick={() => setHistoryCliente(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {historyAgendamentos.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">Nenhum atendimento registrado para este cliente.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                {historyAgendamentos.map((h) => (
                  <div key={h.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">{h.servico_nome || 'Atendimento'}</span>
                      <span className="text-[10px] text-slate-400">{new Date(h.data_hora).toLocaleString()}</span>
                    </div>
                    <span className="font-black text-emerald-400">R$ {parseFloat(h.valor_total || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
