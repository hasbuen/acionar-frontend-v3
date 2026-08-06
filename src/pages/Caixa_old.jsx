import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiRequest } from '../services/api';
import {
  Plus, Wallet, Clock, ArrowDownRight, CheckCircle2, Trash2, X, List, Check,
  Hourglass, BarChart3, DollarSign, PieChart, Activity, Calendar, ArrowUpRight,
  CreditCard, Banknote, QrCode, BadgeCheck
} from 'lucide-react';
import { ModalAlert, useModalAlert } from '../components/ModalAlert';

export function Caixa() {
  const [data, setData] = useState({ movimentacoes: [], resumo: { totalEntradas: 0, totalSaidas: 0, totalAReceber: 0, totalReceber: 0, qtdPendentes: 0, qtdRecebidos: 0, saldo: 0 } });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('todos');
  const [statusTab, setStatusTab] = useState('tudo'); // 'tudo' | 'recebido' | 'a_receber'

  // Persistência do Modo de Exibição (Valores / Gráfico) via localStorage
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('@caixa:viewMode') || 'valores';
  });

  // Persistência do Tipo de Gráfico (Barra / Pizza / Onda) via localStorage
  const [chartType, setChartType] = useState(() => {
    return localStorage.getItem('@caixa:chartType') || 'barra';
  });

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ tipo: 'entrada', descricao: '', valor: '', forma_pagamento: 'pix', status: 'pago' });

  // Modal Dar Baixa
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [baixaTarget, setBaixaTarget] = useState(null); // movimentação selecionada para baixa
  const [baixaFormaPagamento, setBaixaFormaPagamento] = useState('pix');
  const [baixaLoading, setBaixaLoading] = useState(false);

  const { alertState, showAlert, closeAlert } = useModalAlert();

  useEffect(() => {
    fetchCaixa();
  }, [activeFilter]);

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('@caixa:viewMode', mode);
  };

  const handleSetChartType = (type) => {
    setChartType(type);
    localStorage.setItem('@caixa:chartType', type);
  };

  const fetchCaixa = async () => {
    setLoading(true);
    try {
      // Envia o filtro de período ao backend
      const periodo = activeFilter !== 'todos' ? activeFilter : undefined;
      const query = periodo ? `?periodo=${periodo}` : '';
      const res = await apiRequest(`/caixa${query}`);
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
    // Lançamentos vindos de agendamento não podem ser excluídos pelo caixa
    if (String(id).startsWith('ag-')) {
      showAlert({ type: 'warning', title: 'Ação indisponível', message: 'Este lançamento é gerado por um agendamento confirmado. Para removê-lo, cancele o agendamento na tela de Agenda.' });
      return;
    }
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

  // Abre modal de baixa
  const handleOpenBaixa = (movimentacao) => {
    setBaixaTarget(movimentacao);
    setBaixaFormaPagamento('pix');
    setShowBaixaModal(true);
  };

  // Confirma a baixa
  const handleConfirmarBaixa = async () => {
    if (!baixaTarget) return;
    setBaixaLoading(true);
    try {
      await apiRequest(`/caixa/${baixaTarget.id}/baixar`, 'PATCH', { forma_pagamento: baixaFormaPagamento });
      setShowBaixaModal(false);
      setBaixaTarget(null);
      fetchCaixa();
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao dar baixa no lançamento.' });
    } finally {
      setBaixaLoading(false);
    }
  };

  // Helper para renderizar ícone de pagamento
  const renderPaymentBadge = (forma) => {
    if (!forma) return null;
    const f = (forma || '').toLowerCase();
    if (f.includes('pix')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold text-[10px] tracking-wider uppercase border border-teal-500/20">
          <QrCode className="h-3 w-3" /> PIX
        </span>
      );
    }
    if (f.includes('cartao') || f.includes('cartão') || f.includes('credito') || f.includes('debito')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] tracking-wider uppercase border border-blue-500/20">
          <CreditCard className="h-3 w-3" /> Cartão
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] tracking-wider uppercase border border-amber-500/20">
        <Banknote className="h-3 w-3" /> Dinheiro
      </span>
    );
  };

  // Cálculos Financeiros
  const totalRecebido = data.resumo.totalEntradas || 0;
  const aReceber = data.resumo.totalAReceber || data.resumo.totalReceber || 0;
  const totalSaidas = data.resumo.totalSaidas || 0;
  const qtdPendentes = data.resumo.qtdPendentes || 0;
  const qtdRecebidos = data.resumo.qtdRecebidos || 0;

  const somaTotal = totalRecebido + aReceber + totalSaidas || 1;
  const maxValor = Math.max(totalRecebido, aReceber, totalSaidas, 1);

  const pctRecebido = Math.round((totalRecebido / somaTotal) * 100);
  const pctAReceber = Math.round((aReceber / somaTotal) * 100);
  const pctSaidas = Math.round((totalSaidas / somaTotal) * 100);

  const barRecebido = Math.min(Math.round((totalRecebido / maxValor) * 100), 100);
  const barAReceber = Math.min(Math.round((aReceber / maxValor) * 100), 100);
  const barSaidas = Math.min(Math.round((totalSaidas / maxValor) * 100), 100);

  const movimentacoesFiltradas = data.movimentacoes.filter((m) => {
    const status = m.status || (m.pendente ? 'pendente' : 'pago');
    if (statusTab === 'recebido') return status === 'pago';
    if (statusTab === 'a_receber') return status === 'pendente';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 w-full max-w-full overflow-x-hidden">
      <ModalAlert {...alertState} onClose={closeAlert} />

      {/* 1. Header Principal e Botão de Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">FINANCEIRO</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">Fluxo de Caixa</h1>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-animated inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-500/25 transition hover:opacity-90 w-full sm:w-auto shrink-0"
        >
          <Plus className="h-4 w-4" /> Nova Movimentação
        </button>
      </div>

      {/* 2. Filtros de Período */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'hoje', label: 'Hoje' },
          { key: 'semana', label: 'Esta Semana' },
          { key: 'mes', label: 'Este Mês' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`rounded-2xl px-4 py-2.5 text-xs font-extrabold transition-all whitespace-nowrap shrink-0 ${activeFilter === key
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 3. Card de Resumo (Controles + KPIs/Gráficos) */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white/80 p-4 sm:p-6 shadow-xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60 flex flex-col gap-4 sm:gap-6 w-full max-w-full overflow-hidden">

        {/* Cabeçalho do Card (Título + Botões de Visualização) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Resumo do Período
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">Acompanhe recebimentos, compras de materiais e saídas.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {viewMode === 'grafico' && (
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                <button
                  onClick={() => handleSetChartType('barra')}
                  className={`p-2 rounded-xl text-xs font-extrabold transition-all ${chartType === 'barra' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  title="Gráfico de Barras"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleSetChartType('pizza')}
                  className={`p-2 rounded-xl text-xs font-extrabold transition-all ${chartType === 'pizza' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  title="Gráfico de Pizza"
                >
                  <PieChart className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleSetChartType('onda')}
                  className={`p-2 rounded-xl text-xs font-extrabold transition-all ${chartType === 'onda' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  title="Gráfico de Onda / Área"
                >
                  <Activity className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
              <button
                onClick={() => handleSetViewMode('valores')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all ${viewMode === 'valores' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <DollarSign className="h-4 w-4" /> Valores
              </button>
              <button
                onClick={() => handleSetViewMode('grafico')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all ${viewMode === 'grafico' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <BarChart3 className="h-4 w-4" /> Gráfico
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo Dinâmico (KPIs ou Gráficos) */}
        <div className="w-full">
          {viewMode === 'valores' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
              {/* KPI: Total Recebido */}
              <div className="rounded-2xl sm:rounded-3xl border border-emerald-500/20 bg-emerald-50/30 dark:bg-slate-900/60 p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 text-right">
                    {qtdRecebidos} recebimento(s)
                  </div>
                </div>
                <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-tight mb-1">TOTAL RECEBIDO</div>
                <div className="text-xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-tight truncate">
                  R$&nbsp;{totalRecebido.toFixed(2).replace('.', ',')}
                </div>
              </div>

              {/* KPI: À Receber */}
              <div className="rounded-2xl sm:rounded-3xl border border-amber-500/20 bg-amber-50/30 dark:bg-slate-900/60 p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 text-right">
                    {qtdPendentes} em aberto
                  </div>
                </div>
                <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-tight mb-1">À RECEBER</div>
                <div className="text-xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 leading-tight truncate">
                  R$&nbsp;{aReceber.toFixed(2).replace('.', ',')}
                </div>
              </div>

              {/* KPI: Saídas */}
              <div className="rounded-2xl sm:rounded-3xl border border-purple-500/20 bg-purple-50/30 dark:bg-slate-900/60 p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 text-right">
                    Despesas
                  </div>
                </div>
                <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-tight mb-1">SAÍDAS</div>
                <div className="text-xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 leading-tight truncate">
                  R$&nbsp;{totalSaidas.toFixed(2).replace('.', ',')}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 h-full w-full max-w-full overflow-hidden">
              {chartType === 'barra' && (
                <div className="space-y-4 sm:space-y-5 w-full">
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center text-xs font-black gap-2 min-w-0">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 truncate min-w-0">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> <span className="truncate">TOTAL RECEBIDO</span>
                      </span>
                      <span className="text-slate-900 dark:text-white shrink-0">R$ {totalRecebido.toFixed(2).replace('.', ',')} ({barRecebido}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-0.5">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${barRecebido}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center text-xs font-black gap-2 min-w-0">
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 truncate min-w-0">
                        <Clock className="h-4 w-4 shrink-0" /> <span className="truncate">À RECEBER</span>
                      </span>
                      <span className="text-slate-900 dark:text-white shrink-0">R$ {aReceber.toFixed(2).replace('.', ',')} ({barAReceber}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-0.5">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${barAReceber}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center text-xs font-black gap-2 min-w-0">
                      <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 truncate min-w-0">
                        <ArrowDownRight className="h-4 w-4 shrink-0" /> <span className="truncate">SAÍDAS</span>
                      </span>
                      <span className="text-slate-900 dark:text-white shrink-0">R$ {totalSaidas.toFixed(2).replace('.', ',')} ({barSaidas}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-0.5">
                      <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${barSaidas}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {chartType === 'pizza' && (
                <div className="flex flex-col sm:flex-row items-center justify-around gap-4 sm:gap-6 py-2 w-full">
                  <div className="relative h-36 w-36 sm:h-44 sm:w-44 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="3.8" strokeDasharray={`${pctRecebido} ${100 - pctRecebido}`} strokeDashoffset="0" />
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="3.8" strokeDasharray={`${pctAReceber} ${100 - pctAReceber}`} strokeDashoffset={`-${pctRecebido}`} />
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#a855f7" strokeWidth="3.8" strokeDasharray={`${pctSaidas} ${100 - pctSaidas}`} strokeDashoffset={`-${pctRecebido + pctAReceber}`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Total</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">R$ {(totalRecebido + aReceber + totalSaidas).toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3 w-full max-w-xs">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <span className="h-3 w-3 rounded-full bg-emerald-50 inline-block" /> Total Recebido
                      </span>
                      <span className="text-slate-900 dark:text-white">{pctRecebido}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" /> À Receber
                      </span>
                      <span className="text-slate-900 dark:text-white">{pctAReceber}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <span className="h-3 w-3 rounded-full bg-purple-500 inline-block" /> Saídas
                      </span>
                      <span className="text-slate-900 dark:text-white">{pctSaidas}%</span>
                    </div>
                  </div>
                </div>
              )}

              {chartType === 'onda' && (() => {
                const svgWidth = 500;
                const svgHeight = 150;
                const paddingY = 25;
                const usableHeight = svgHeight - paddingY * 2;
                const getY = (val) => svgHeight - paddingY - (val / maxValor) * usableHeight;

                const x1 = 80;
                const x2 = 250;
                const x3 = 420;

                const y1 = getY(totalRecebido);
                const y2 = getY(aReceber);
                const y3 = getY(totalSaidas);

                const pathD = `
                  M 0,${y1} 
                  L ${x1},${y1} 
                  C ${x1 + 75},${y1} ${x2 - 75},${y2} ${x2},${y2} 
                  C ${x2 + 75},${y2} ${x3 - 75},${y3} ${x3},${y3} 
                  L ${svgWidth},${y3}
                `;

                const fillD = `
                  ${pathD} 
                  L ${svgWidth},${svgHeight} 
                  L 0,${svgHeight} 
                  Z
                `;

                return (
                  <div className="space-y-3 sm:space-y-4 w-full">
                    <div className="h-36 sm:h-44 w-full rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/35 overflow-hidden p-2 sm:p-3">
                      <svg
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        className="w-full h-full"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="gradientWave" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        <path d={fillD} fill="url(#gradientWave)" />

                        <path
                          d={pathD}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />

                        <circle cx={x1} cy={y1} r="5" className="fill-emerald-500 stroke-white dark:stroke-slate-900" strokeWidth="2" />
                        <circle cx={x2} cy={y2} r="5" className="fill-amber-500 stroke-white dark:stroke-slate-900" strokeWidth="2" />
                        <circle cx={x3} cy={y3} r="5" className="fill-purple-500 stroke-white dark:stroke-slate-900" strokeWidth="2" />
                      </svg>
                    </div>

                    <div className="grid grid-cols-3 text-center text-xs font-bold pt-2 border-t border-slate-100 dark:border-slate-800 w-full gap-1">
                      <div className="min-w-0">
                        <span className="block text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] sm:text-xs truncate">Recebido</span>
                        <span className="text-slate-900 dark:text-white font-black text-xs sm:text-sm truncate block">R$ {totalRecebido.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="block text-amber-600 dark:text-amber-400 font-extrabold text-[10px] sm:text-xs truncate">A Receber</span>
                        <span className="text-slate-900 dark:text-white font-black text-xs sm:text-sm truncate block">R$ {aReceber.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="block text-purple-600 dark:text-purple-400 font-extrabold text-[10px] sm:text-xs truncate">Saídas</span>
                        <span className="text-slate-900 dark:text-white font-black text-xs sm:text-sm truncate block">R$ {totalSaidas.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Painel de Lançamentos */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-3 sm:p-6 shadow-xl backdrop-blur-xl space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
        {/* Header do Card */}
        <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4 w-full">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
              Lançamentos do Período
            </h3>
          </div>

          {/* Filtros em Abas */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50 w-full overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStatusTab('tudo')}
              className={`flex-1 min-w-[65px] flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all whitespace-nowrap ${statusTab === 'tudo'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              <List className="h-3.5 w-3.5 shrink-0" /> Tudo
            </button>

            <button
              onClick={() => setStatusTab('recebido')}
              className={`flex-1 min-w-[80px] flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all whitespace-nowrap ${statusTab === 'recebido'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              <Check className="h-3.5 w-3.5 shrink-0" /> Recebidos
            </button>

            <button
              onClick={() => setStatusTab('a_receber')}
              className={`flex-1 min-w-[80px] flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all whitespace-nowrap ${statusTab === 'a_receber'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              <Hourglass className="h-3.5 w-3.5 shrink-0" /> Pendentes
            </button>
          </div>
        </div>

        {/* Lista de Movimentações (AGORA EM TABELA) */}
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-xs font-bold animate-pulse">Carregando movimentações...</div>
        ) : movimentacoesFiltradas.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            Nenhum lançamento encontrado.
          </div>
        ) : (
          <div className="w-full overflow-x-auto max-h-[55vh] sm:max-h-[520px] rounded-xl border border-slate-200 dark:border-slate-800 no-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Data</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Valor</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Status / Pgto</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Categoria</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Descrição</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {movimentacoesFiltradas.map((m) => {
                  const isEntrada = m.tipo === 'entrada';
                  const isSaida = m.tipo === 'saida';
                  const isPago = m.status === 'pago';
                  const isAgendamentoVirtual = m.origem === 'agendamento';

                  return (
                    <tr
                      key={m.id}
                      className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${isAgendamentoVirtual && !isPago ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''
                        }`}
                    >

                      {/* 2. Data */}
                      <td className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {new Date(m.data_movimento).toLocaleDateString('pt-BR')}
                      </td>

                      {/* 5. Valor */}
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs sm:text-sm font-black whitespace-nowrap ${isEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                          {isEntrada ? '+' : '-'}&nbsp;R$&nbsp;{parseFloat(m.valor).toFixed(2).replace('.', ',')}
                        </span>
                      </td>

                      {/* 4. Status e Forma de Pgto */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          {renderPaymentBadge(m.forma_pagamento)}
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider text-[9px] ${isPago ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                            }`}>
                            {isPago ? '✓ Pago' : '⏳ Pendente'}
                          </span>
                        </div>
                      </td>

                      {/* 3. Categoria / Tipo */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`px-2 py-0.5 rounded-lg font-black uppercase tracking-wider text-[9px] ${isEntrada ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}>
                            {m.tipo}
                          </span>
                          {m.categoria === 'agendamento' && (
                            <span className="px-2 py-0.5 rounded-lg font-black uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[9px]">
                              {m.categoria === 'agendamento' && m.origem === 'agendamento' ? 'Agendamento' : 'Serviço'}
                            </span>
                          )}
                          {m.categoria === 'material' && (
                            <span className="px-2 py-0.5 rounded-lg font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px]">
                              {m.categoria === 'material' ? 'Material' : 'Serviço'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 1. Descrição */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${isEntrada ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}>
                            {isEntrada ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          </div>
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {m.descricao}
                          </span>
                        </div>
                      </td>

                      {/* 6. Ações */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {!isPago && (isEntrada || isSaida) && (
                            <button
                              onClick={() => handleOpenBaixa(m)}
                              title="Dar Baixa"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-[10px] font-black uppercase tracking-wide transition-all border border-emerald-500/20"
                            >
                              <BadgeCheck className="h-3 w-3 shrink-0" /> Baixar
                            </button>
                          )}
                          {isPago && (
                            <span
                              title="Lançamento já baixado"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-wide cursor-default select-none"
                            >
                              <Check className="h-3 w-3 shrink-0" /> Baixado
                            </span>
                          )}
                          {!(isAgendamentoVirtual && !isPago) && (
                            <button
                              onClick={() => handleDeleteEntry(m.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  {/* Modal Nova Movimentação */ }
  {
    showModal && createPortal(
      <div className="fixed inset-0 z-[999999] h-screen w-screen flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
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
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">STATUS</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                <option value="pago">Pago / Recebido</option>
                <option value="pendente">Pendente / A Receber</option>
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
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition">Cancelar</button>
              <button type="submit" className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-xs font-black text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-500/10">Lançar no Caixa</button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )
  };

  {/* Modal Dar Baixa */ }
  {
    showBaixaModal && baixaTarget && createPortal(
      <div className="fixed inset-0 z-[999999] h-screen w-screen flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <BadgeCheck className="h-4 w-4" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Dar Baixa</h3>
            </div>
            <button onClick={() => setShowBaixaModal(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded-lg">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Resumo do lançamento */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 space-y-1 border border-slate-200/60 dark:border-slate-700/40">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{baixaTarget.descricao}</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              R$ {parseFloat(baixaTarget.valor).toFixed(2).replace('.', ',')}
            </p>
            <p className="text-[10px] font-semibold text-slate-400">
              {new Date(baixaTarget.data_movimento).toLocaleDateString('pt-BR')}
            </p>
          </div>

          {/* Seletor de forma de pagamento */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">FORMA DE PAGAMENTO RECEBIDA</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'pix', label: 'PIX', icon: <QrCode className="h-4 w-4" />, color: 'teal' },
                { value: 'cartao_credito', label: 'Crédito', icon: <CreditCard className="h-4 w-4" />, color: 'blue' },
                { value: 'cartao_debito', label: 'Débito', icon: <CreditCard className="h-4 w-4" />, color: 'indigo' },
                { value: 'dinheiro', label: 'Dinheiro', icon: <Banknote className="h-4 w-4" />, color: 'amber' },
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBaixaFormaPagamento(value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-xs font-extrabold transition-all ${baixaFormaPagamento === value
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                    }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowBaixaModal(false)}
              className="flex-1 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmarBaixa}
              disabled={baixaLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:opacity-90 transition disabled:opacity-60"
            >
              {baixaLoading ? (
                <span className="animate-pulse">Baixando...</span>
              ) : (
                <><BadgeCheck className="h-4 w-4" /> Confirmar Baixa</>
              )}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  };
}
