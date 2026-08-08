import React, { useState, useEffect } from 'react';
import { X, Headphones, RefreshCw, Paperclip, CheckCircle2, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { apiRequest } from '../services/api';

export function SupportDemandsModal({ isOpen, onClose, showAlert }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('todos');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/suporte/demandas');
      setTickets(res.tickets || []);
    } catch (err) {
      if (showAlert) showAlert({ type: 'error', title: 'Erro ao carregar', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
    }
  }, [isOpen]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await apiRequest(`/suporte/demandas/${id}/status`, 'PUT', { status });
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    } catch (err) {
      if (showAlert) showAlert({ type: 'error', message: err.message });
    }
  };

  if (!isOpen) return null;

  const filteredTickets = tickets.filter(t => filterStatus === 'todos' ? true : t.status === filterStatus);

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-2xl max-h-[88dvh] overflow-y-auto scroll-y-touch pb-safe-bottom rounded-t-[2.2rem] sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xl space-y-5 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 font-black">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">
                CENTRAL DE ATENDIMENTO
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                Demandas de Suporte
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTickets}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              title="Atualizar"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {['todos', 'pendente', 'em_atendimento', 'concluido'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition shrink-0 ${
                filterStatus === st
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st === 'todos' ? 'Todos os Chamados' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Lista de Chamados */}
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">Carregando demandas...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">Nenhum chamado de suporte registrado.</div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/60 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                      #{t.id} {t.tenant_nome}
                    </span>
                    <span className="text-xs font-bold text-slate-400">({t.usuario_nome})</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <select
                      value={t.status}
                      onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none"
                    >
                      <option value="pendente">Pendente ⏳</option>
                      <option value="em_atendimento">Em Atendimento 🛠️</option>
                      <option value="concluido">Concluído ✅</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">{t.assunto}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{t.mensagem}</p>
                </div>

                {t.anexo_url && (
                  <div className="pt-1">
                    <a
                      href={t.anexo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-slate-300 transition"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      Visualizar Anexo ({t.anexo_nome || 'Arquivo'})
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Contato: {t.usuario_email} {t.usuario_whatsapp ? `| ${t.usuario_whatsapp}` : ''}</span>
                  <time>{new Date(t.created_at).toLocaleString()}</time>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
