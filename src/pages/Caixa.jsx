import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Plus, Wallet, TrendingUp, Clock, ArrowDownRight, CheckCircle2, DollarSign, Trash2, X } from 'lucide-react';
import { ModalAlert, useModalAlert } from '../components/ModalAlert';

export function Caixa() {
  const [data, setData] = useState({ movimentacoes: [], resumo: { totalEntradas: 0, totalSaidas: 0, saldo: 0 } });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ tipo: 'entrada', descricao: '', valor: '', forma_pagamento: 'pix' });
  const { alertState, showAlert, closeAlert } = useModalAlert();

  useEffect(() => {
    fetchCaixa();
  }, [activeFilter]);

  const fetchCaixa = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/caixa');
      setData(res);
    } catch (err) {
      console.error('[CAIXA ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/caixa', 'POST', {
        ...form,
        valor: parseFloat(form.valor),
      });
      setShowModal(false);
      fetchCaixa();
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao registrar movimentação.' });
    }
  };

  const handleDeleteEntry = (id) => {
    showAlert({
      type: 'warning',
      title: 'Excluir lançamento',
      message: 'Deseja excluir este lançamento do caixa?',
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        closeAlert();
        try {
          await apiRequest(`/caixa/${id}`, 'DELETE');
          fetchCaixa();
        } catch (err) {
          showAlert({ type: 'error', message: 'Erro ao excluir lançamento.' });
        }
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <ModalAlert {...alertState} onClose={closeAlert} />
      {/* Header Banner */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">FINANCEIRO</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Fluxo de Caixa</h1>
        </div>
      </div>

      {/* Main Banner Card */}
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60 space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
          GESTÃO FINANCEIRA COMPLETA
        </span>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Entradas, saídas & saldo</h2>
            <p className="text-xs text-slate-400 mt-1">Acompanhe recebimentos, compras de materiais e acertos entre profissionais.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-animated inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-emerald-500/25"
          >
            <Plus className="h-4 w-4" /> Nova Movimentação
          </button>
        </div>

        <div className="flex items-center gap-2 pt-2 overflow-x-auto no-scrollbar">
          {['todos', 'hoje', 'semana', 'mes'].map((k) => (
            <button
              key={k}
              onClick={() => setActiveFilter(k)}
              className={`rounded-2xl px-4 py-2 text-xs font-extrabold transition-all ${
                activeFilter === k
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {k === 'todos' ? 'Todos' : k === 'hoje' ? 'Hoje' : k === 'semana' ? 'Esta Semana' : 'Este Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid (Matching Screenshot 4) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: TOTAL RECEBIDO */}
        <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">TOTAL RECEBIDO (PAGO)</span>
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-400">
            R$ {data.resumo.totalEntradas.toFixed(2).replace('.', ',')}
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-400">
            {data.movimentacoes.filter(m => m.tipo === 'entrada').length} lançamento(s) efetuados
          </div>
        </div>

        {/* KPI 2: À RECEBER */}
        <div className="rounded-3xl border border-amber-500/20 bg-slate-900/60 p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">À RECEBER (PENDENTE)</span>
            <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-amber-400">
            R$ 440,00
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-400">
            5 valor(es) em aberto
          </div>
        </div>

        {/* KPI 3: SAÍDAS */}
        <div className="rounded-3xl border border-purple-500/20 bg-slate-900/60 p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">SAÍDAS E COMPROMISSOS</span>
            <div className="h-8 w-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-purple-400">
            R$ {data.resumo.totalSaidas.toFixed(2).replace('.', ',')}
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-400">
            0 paga(s) · 0 pendente(s)
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <h3 className="text-base font-black text-white">Lançamentos do Período</h3>
        {loading ? (
          <div className="text-center py-8 text-slate-400">Carregando movimentações...</div>
        ) : data.movimentacoes.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">Nenhum lançamento no caixa.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Data</th>
                  <th className="pb-3">Descrição</th>
                  <th className="pb-3">Forma Pagto</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3">Valor</th>
                  <th className="pb-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.movimentacoes.map((m) => (
                  <tr key={m.id} className="text-slate-200">
                    <td className="py-3 font-semibold text-slate-400">{new Date(m.data_movimento).toLocaleDateString()}</td>
                    <td className="py-3 font-bold text-white">{m.descricao}</td>
                    <td className="py-3 text-xs uppercase font-semibold text-slate-400">{m.forma_pagamento}</td>
                    <td className="py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        m.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className={`py-3 font-black ${m.tipo === 'entrada' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      R$ {parseFloat(m.valor).toFixed(2)}
                    </td>
                    <td className="py-3">
                      <button onClick={() => handleDeleteEntry(m.id)} className="text-rose-400 hover:text-rose-300">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nova Movimentação */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/15 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Nova Movimentação</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">TIPO DE LANÇAMENTO</label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                  <option value="entrada">Entrada (+)</option>
                  <option value="saida">Saída (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">DESCRIÇÃO</label>
                <input type="text" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="ex: Pagamento de Atendimento" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">VALOR (R$)</label>
                <input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0.00" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">FORMA DE PAGAMENTO</label>
                <select value={form.forma_pagamento} onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                  <option value="pix">PIX</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Debito</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-xs font-black text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-500/10">Lançar no Caixa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
