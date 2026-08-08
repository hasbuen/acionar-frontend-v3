import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiRequest } from '../services/api';
import { Plus, Package, ArrowDown, ArrowUp, ArrowRightLeft, ClipboardCheck, History, AlertTriangle, Search, X, Check, DollarSign, Trash2, Minus, Send, ArrowUpDown } from 'lucide-react';
import { ModalAlert, useModalAlert } from '../components/ModalAlert';
import { PremiumSelect } from '../components/PremiumSelect';

export function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBaixo, setFilterBaixo] = useState(false);
  const { alertState, showAlert, closeAlert } = useModalAlert();

  // Modals
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const [showMovimento, setShowMovimento] = useState(false);
  const [showInventario, setShowInventario] = useState(false);
  const [showTransferencia, setShowTransferencia] = useState(false);
  const [showRazao, setShowRazao] = useState(false);

  const [selectedProduto, setSelectedProduto] = useState(null);
  const [historicoMovimentacoes, setHistoricoMovimentacoes] = useState([]);

  // Form Wizard
  const [form, setForm] = useState({
    nome: '',
    tipo: 'consumo',
    codigo: '',
    categoria: 'Geral',
    quantidade: 10,
    estoque_minimo: 3,
    custo_unitario: 15.0,
    imagem_url: '',
    localizacao: '',
    status_pagamento: 'pago',
  });

  // Form Movimento
  const [movForm, setMovForm] = useState({
    tipo: 'entrada',
    quantidade: 1,
    motivo: '',
    status_pagamento: 'pago',
  });

  // Form Transferencia
  const [transfForm, setTransfForm] = useState({
    profissional_id: '',
    quantidade: 1,
  });

  // Form Inventario Guiado
  const [inventarioData, setInventarioData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await apiRequest('/estoque/produtos');
      setProdutos(pRes.produtos || []);
      const profRes = await apiRequest('/profissionais').catch(() => ({ profissionais: [] }));
      setProfissionais(profRes.profissionais || []);
    } catch (err) {
      console.error('[ESTOQUE ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGerarSku = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setForm(prev => ({ ...prev, codigo: `SKU-${random}` }));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/estoque/produtos', 'POST', {
        ...form,
        quantidade: parseInt(form.quantidade, 10),
        estoque_minimo: parseInt(form.estoque_minimo, 10),
        custo_unitario: parseFloat(form.custo_unitario),
      });
      setShowWizard(false);
      fetchData();
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao cadastrar produto.' });
    }
  };

  const openMovement = (tipo = 'entrada', produto = null) => {
    setSelectedProduto(produto);
    setMovForm({ tipo, quantidade: 1, motivo: '', status_pagamento: 'pago' });
    setShowMovimento(true);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedProduto) return;
    try {
      await apiRequest('/estoque/transferencias', 'POST', { produto_id: selectedProduto.id, profissional_id: transfForm.profissional_id, quantidade: parseInt(transfForm.quantidade, 10) });
      setShowTransferencia(false);
      setSelectedProduto(null);
      setTransfForm({ profissional_id: '', quantidade: 1 });
      fetchData();
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao enviar produto.' });
    }
  };

  const handleRegistrarMovimento = async (e) => {
    e.preventDefault();
    if (!selectedProduto) return;
    try {
      await apiRequest('/estoque/movimentacoes', 'POST', {
        produto_id: selectedProduto.id,
        tipo: movForm.tipo,
        quantidade: parseInt(movForm.quantidade, 10),
        motivo: movForm.motivo,
        status_pagamento: movForm.tipo === 'entrada' ? (movForm.status_pagamento || 'pago') : undefined,
      });
      setShowMovimento(false);
      fetchData();
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao registrar movimentação.' });
    }
  };

  const handleOpenInventario = () => {
    const initial = {};
    produtos.forEach(p => { initial[p.id] = p.quantidade; });
    setInventarioData(initial);
    setShowInventario(true);
  };

  const handleSalvarInventario = async () => {
    try {
      for (const p of produtos) {
        const novaQtd = parseInt(inventarioData[p.id], 10);
        if (!isNaN(novaQtd) && novaQtd !== p.quantidade) {
          const diff = novaQtd - p.quantidade;
          await apiRequest('/estoque/movimentacoes', 'POST', {
            produto_id: p.id,
            tipo: diff > 0 ? 'entrada' : 'saida',
            quantidade: Math.abs(diff),
            motivo: 'Ajuste de Inventário Guiado',
          });
        }
      }
      setShowInventario(false);
      fetchData();
    } catch (err) {
      showAlert({ type: 'error', message: 'Erro ao salvar inventário.' });
    }
  };

  const handleDeleteProduct = (p) => {
    showAlert({
      type: 'warning',
      title: 'Excluir produto',
      message: `Tem certeza que deseja excluir "${p.nome}"? Esta ação é irreversível.`,
      confirmLabel: 'Sim, excluir',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        closeAlert();
        try {
          await apiRequest(`/estoque/produtos/${p.id}`, 'DELETE');
          showAlert({ type: 'success', message: 'Produto excluído com sucesso.' });
          fetchData();
        } catch (err) {
          showAlert({ type: 'error', message: err.message || 'Erro ao excluir produto.' });
        }
      },
    });
  };

  const handleOpenHistory = async (p) => {
    setSelectedProduto(p);
    setShowRazao(true);
    setHistoricoMovimentacoes([]);
    try {
      const res = await apiRequest(`/estoque/movimentacoes?produto_id=${p.id}`);
      setHistoricoMovimentacoes(res.movimentacoes || []);
    } catch (err) {
      console.error(err);
    }
  };

  // KPIs
  const totalItens = produtos.length;
  const valorTotalCusto = produtos.reduce((acc, p) => acc + (parseFloat(p.custo_unitario || 0) * (p.quantidade || 0)), 0);
  const alertasBaixo = produtos.filter(p => p.quantidade <= (p.estoque_minimo || 1)).length;

  const filteredProdutos = produtos.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase()) || (p.codigo && p.codigo.toLowerCase().includes(search.toLowerCase()));
    const matchesBaixo = filterBaixo ? p.quantidade <= (p.estoque_minimo || 1) : true;
    return matchesSearch && matchesBaixo;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <ModalAlert {...alertState} onClose={closeAlert} />
      
      {/* Banner de Boas-vindas */}
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
            MATERIAIS DO PROFISSIONAL
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Seu estoque, sem bagunça
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Cadastre consumos e ferramentas. O produto só entra em um serviço quando você decidir vinculá-lo.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2">
          <button
            onClick={handleOpenInventario}
            className="px-4 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition hover:opacity-90"
          >
            <ClipboardCheck className="h-4 w-4 text-purple-500" /> Inventário
          </button>
          <button
            onClick={() => { setSelectedProduto(null); setTransfForm({ profissional_id: '', quantidade: 1 }); setShowTransferencia(true); }}
            className="px-4 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition hover:opacity-90"
          >
            <ArrowRightLeft className="h-4 w-4 text-sky-500" /> Enviar
          </button>
          <button
            onClick={() => openMovement('entrada')}
            className="px-4 py-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold flex items-center justify-center gap-1.5 border border-emerald-500/20 transition hover:bg-emerald-500/20"
          >
            <ArrowDown className="h-4 w-4" /> Entrada
          </button>
          <button
            onClick={() => { setWizardStep(1); setForm({ nome: '', tipo: 'consumo', codigo: '', categoria: 'Geral', quantidade: 10, estoque_minimo: 3, custo_unitario: 15.0, imagem_url: '', localizacao: '', status_pagamento: 'pago' }); handleGerarSku(); setShowWizard(true); }}
            className="px-4 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1.5 transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Novo produto
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 shadow-sm backdrop-blur-md">
          <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-lg mb-2">
            <Package className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">TOTAL DE PRODUTOS</span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalItens}</h3>
        </div>

        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 shadow-sm backdrop-blur-md">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg mb-2">
            <DollarSign className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">VALOR EM ESTOQUE</span>
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">R$ {valorTotalCusto.toFixed(2)}</h3>
        </div>

        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 shadow-sm backdrop-blur-md">
          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-lg mb-2 ${alertasBaixo > 0 ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">ALERTAS DE ESTOQUE</span>
          <h3 className={`text-xl font-black mt-0.5 ${alertasBaixo > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {alertasBaixo} {alertasBaixo === 1 ? 'produto' : 'produtos'}
          </h3>
        </div>

        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 shadow-sm backdrop-blur-md">
          <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-lg mb-2">
            <History className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">ESTADO DO ESTOQUE</span>
          <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">100% Atualizado</h3>
        </div>
      </div>

      {/* Search Bar & Alert Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou SKU..."
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 pl-11 pr-4 py-3 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={() => setFilterBaixo(!filterBaixo)}
          className={`px-4 py-3 rounded-2xl border text-xs font-extrabold transition ${
            filterBaixo
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
              : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          ⚠️ Mostrar Apenas Estoque Baixo
        </button>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando produtos...</div>
      ) : filteredProdutos.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900/40">
          <Package className="mx-auto h-12 w-12 opacity-30 mb-3" />
          <p className="font-semibold text-sm">Nenhum produto encontrado no estoque.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProdutos.map((p) => {
            const isBaixo = p.quantidade <= (p.estoque_minimo || 1);
            return (
              <div
                key={p.id}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-5 shadow-lg backdrop-blur-xl flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
                      {p.imagem_url ? <img src={p.imagem_url} alt={p.nome} className="h-full w-full object-cover" /> : <Package className="mx-auto mt-5 h-6 w-6 text-slate-400 dark:text-slate-600" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                        {p.tipo || 'CONSUMO'}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{p.nome}</h3>
                      {p.codigo && <span className="text-[11px] font-mono text-slate-500">{p.codigo}</span>}
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      isBaixo ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {p.quantidade} un
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mt-3">
                    <div className="flex justify-between">
                      <span>Custo Unitário:</span>
                      <strong className="text-slate-900 dark:text-slate-200">R$ {parseFloat(p.custo_unitario || 0).toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Estoque Mínimo:</span>
                      <strong className="text-slate-900 dark:text-slate-200">{p.estoque_minimo || 1} un</strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => openMovement('entrada', p)}
                    className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition"
                    title="Movimentar"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openMovement('entrada', p)}
                    className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                    title="Entrada"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openMovement('saida', p)}
                    className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition"
                    title="Saída"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setSelectedProduto(p); setTransfForm({ profissional_id: '', quantidade: 1 }); setShowTransferencia(true); }}
                    className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/20 hover:bg-sky-500/20 transition"
                    title="Enviar para outro auxiliar"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenHistory(p)}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                    title="Histórico / Extrato"
                  >
                    <History className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p)}
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20 hover:bg-red-500/20 transition ml-auto"
                    title="Excluir Produto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: WIZARD NOVO PRODUTO */}
      {showWizard && createPortal(
        <div className="fixed inset-0 z-[999999] h-screen w-screen flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">WIZARD DE PRODUTO — PASSO {wizardStep}/3</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Cadastrar Novo Produto</h3>
              </div>
              <button onClick={() => setShowWizard(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">NOME DO PRODUTO</label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Ex: Cílios Volume Brasileiro"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">SKU / CÓDIGO</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.codigo}
                        onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                        className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500"
                      />
                      <button type="button" onClick={handleGerarSku} className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                        Gerar SKU
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">TIPO</label>
                    <PremiumSelect
                      value={form.tipo}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    >
                      <option value="consumo">Consumo Interno (Insumo)</option>
                      <option value="venda">Revenda para Cliente</option>
                    </PremiumSelect>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">QUANTIDADE INICIAL</label>
                    <input
                      type="number"
                      value={form.quantidade}
                      onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">ESTOQUE MÍNIMO PARA ALERTA</label>
                    <input
                      type="number"
                      value={form.estoque_minimo}
                      onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">CUSTO UNITÁRIO (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.custo_unitario}
                      onChange={(e) => setForm({ ...form, custo_unitario: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500"
                    />
                  </div>

                  {parseFloat(form.custo_unitario || 0) > 0 && parseInt(form.quantidade || 0, 10) > 0 && (
                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">SITUAÇÃO DO PAGAMENTO</label>
                      <PremiumSelect
                        value={form.status_pagamento || 'pago'}
                        onChange={(e) => setForm({ ...form, status_pagamento: e.target.value })}
                      >
                        <option value="pago">Pago (Gerar despesa paga no caixa)</option>
                        <option value="a_pagar">A Pagar / Pendente (Gerar despesa pendente no caixa)</option>
                      </PremiumSelect>
                    </div>
                  )}
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">LOCALIZAÇÃO NO ESTABELECIMENTO</label>
                    <input
                      type="text"
                      value={form.localizacao}
                      onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
                      placeholder="Ex: Armário A, Prateleira 2"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">URL DA IMAGEM DO PRODUTO (OPCIONAL)</label>
                    <input
                      type="text"
                      value={form.imagem_url}
                      onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500"
                    />
                    <label className="mt-3 block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
                      OU ENVIE UMA FOTO
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => { 
                          const file = e.target.files?.[0]; 
                          if (!file) return; 
                          const reader = new FileReader(); 
                          reader.onload = async () => { 
                            try {
                              const res = await apiRequest('/config/upload-image', 'POST', {
                                type: 'produtos',
                                imageBase64: reader.result
                              });
                              setForm(prev => ({ ...prev, imagem_url: res.foto_url })); 
                            } catch (err) {
                              showAlert({ type: 'error', message: err.message || 'Erro ao enviar foto.' });
                            }
                          }; 
                          reader.readAsDataURL(file); 
                        }} 
                        className="mt-1 block w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-black file:text-white" 
                      />
                    </label>
                    {form.imagem_url && <img src={form.imagem_url} alt="Prévia do produto" className="mt-3 h-20 w-20 rounded-2xl border border-slate-200 dark:border-slate-700 object-cover" />}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3">
                {wizardStep > 1 ? (
                  <button type="button" onClick={() => setWizardStep(wizardStep - 1)} className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                    Voltar
                  </button>
                ) : <div />}

                {wizardStep < 3 ? (
                  <button type="button" onClick={() => setWizardStep(wizardStep + 1)} className="px-6 py-2.5 rounded-2xl bg-blue-600 text-xs font-black text-white">
                    Próximo
                  </button>
                ) : (
                  <button type="submit" className="px-6 py-2.5 rounded-2xl bg-emerald-600 text-xs font-black text-white shadow-lg">
                    Salvar Produto
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: TRANSFERÊNCIA */}
      {showTransferencia && createPortal(
        <div className="fixed inset-0 z-[999999] h-screen w-screen flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-400">TRANSFERÊNCIA DE ESTOQUE</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Enviar para outro auxiliar</h3>
              </div>
              <button onClick={() => setShowTransferencia(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleTransfer} className="space-y-4">
              <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
                PRODUTO
                <PremiumSelect 
                  value={selectedProduto?.id || ''} 
                  onChange={e => setSelectedProduto(produtos.find(product => Number(product.id) === Number(e.target.value)) || null)} 
                  className="mt-1" 
                  required
                >
                  <option value="">Selecione um produto</option>
                  {produtos.filter(product => Number(product.quantidade) > 0).map(product => (
                    <option key={product.id} value={product.id}>{product.nome} — saldo: {product.quantidade} un</option>
                  ))}
                </PremiumSelect>
              </label>

              {selectedProduto && (
                <div className="rounded-2xl border border-sky-500/25 bg-sky-500/10 p-3 text-xs text-sky-700 dark:text-sky-200">
                  Saldo disponível: <strong>{selectedProduto.quantidade} unidades</strong>
                </div>
              )}

              <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
                AUXILIAR DESTINO
                <PremiumSelect 
                  value={transfForm.profissional_id} 
                  onChange={e => setTransfForm({ ...transfForm, profissional_id: e.target.value })} 
                  className="mt-1" 
                  required
                >
                  <option value="">Selecione o auxiliar</option>
                  {profissionais.filter(professional => Number(professional.id) !== Number(selectedProduto?.profissional_id)).map(professional => (
                    <option key={professional.id} value={professional.id}>{professional.nome}</option>
                  ))}
                </PremiumSelect>
              </label>

              <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
                QUANTIDADE
                <input 
                  type="number" 
                  min="1" 
                  max={selectedProduto?.quantidade || undefined} 
                  value={transfForm.quantidade} 
                  onChange={e => setTransfForm({ ...transfForm, quantidade: e.target.value })} 
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500" 
                  required 
                />
              </label>

              <button className="w-full rounded-2xl bg-sky-600 py-3.5 text-xs font-black text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700">
                Confirmar envio
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: MOVIMENTAÇÃO ENTRADA / SAÍDA */}
      {showMovimento && createPortal(
        <div className="fixed inset-0 z-[999999] h-screen w-screen flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl space-y-4 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">REGISTRAR MOVIMENTAÇÃO</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedProduto?.nome}</h3>
              </div>
              <button onClick={() => setShowMovimento(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarMovimento} className="space-y-4">
              {!selectedProduto && (
                <div>
                  <label className="mb-1 block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">PRODUTO</label>
                  <PremiumSelect 
                    value="" 
                    onChange={e => setSelectedProduto(produtos.find(product => Number(product.id) === Number(e.target.value)) || null)} 
                    required
                  >
                    <option value="">Selecione o produto para movimentar...</option>
                    {produtos.map(product => <option key={product.id} value={product.id}>{product.nome} — saldo: {product.quantidade} un</option>)}
                  </PremiumSelect>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">TIPO DE MOVIMENTO</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovForm({ ...movForm, tipo: 'entrada' })}
                    className={`py-3 rounded-2xl text-xs font-black transition ${movForm.tipo === 'entrada' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}
                  >
                    + ENTRADA
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovForm({ ...movForm, tipo: 'saida' })}
                    className={`py-3 rounded-2xl text-xs font-black transition ${movForm.tipo === 'saida' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}
                  >
                    - SAÍDA
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">QUANTIDADE</label>
                <input
                  type="number"
                  min="1"
                  value={movForm.quantidade}
                  onChange={(e) => setMovForm({ ...movForm, quantidade: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">MOTIVO / OBSERVAÇÃO</label>
                <input
                  type="text"
                  value={movForm.motivo}
                  onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })}
                  placeholder="Ex: Compra de reposição..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500"
                />
              </div>

              {movForm.tipo === 'entrada' && selectedProduto && parseFloat(selectedProduto.custo_unitario || 0) > 0 && (
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">SITUAÇÃO DO PAGAMENTO</label>
                  <PremiumSelect
                    value={movForm.status_pagamento || 'pago'}
                    onChange={(e) => setMovForm({ ...movForm, status_pagamento: e.target.value })}
                  >
                    <option value="pago">Pago (Gerar despesa paga no caixa)</option>
                    <option value="a_pagar">A Pagar / Pendente (Gerar despesa pendente no caixa)</option>
                  </PremiumSelect>
                </div>
              )}

              <button type="submit" className="w-full py-3.5 rounded-2xl bg-blue-600 text-xs font-black text-white transition hover:bg-blue-700">
                Confirmar Movimentação
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: INVENTÁRIO GUIADO */}
      {showInventario && createPortal(
        <div className="fixed inset-0 z-[999999] h-screen w-screen flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">AJUSTE RÁPIDO</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Inventário Guiado em Lote</h3>
              </div>
              <button onClick={() => setShowInventario(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {produtos.map(p => (
                <div key={p.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">{p.nome}</h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Atual: {p.quantidade} un</span>
                  </div>
                  <input
                    type="number"
                    value={inventarioData[p.id] ?? p.quantidade}
                    onChange={(e) => setInventarioData({ ...inventarioData, [p.id]: e.target.value })}
                    className="w-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-black text-slate-900 dark:text-white text-center"
                  />
                </div>
              ))}
            </div>

            <button onClick={handleSalvarInventario} className="w-full py-3.5 rounded-2xl bg-purple-600 text-xs font-black text-white transition hover:opacity-90">
              ✓ Salvar Ajuste de Inventário
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 4: RAZÃO / HISTÓRICO */}
      {showRazao && selectedProduto && createPortal(
        <div className="fixed inset-0 z-[999999] h-screen w-screen flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl space-y-4 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">EXTRATO DE MOVIMENTAÇÕES</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedProduto.nome}</h3>
              </div>
              <button onClick={() => setShowRazao(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 max-h-80 overflow-y-auto pr-2">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 mb-2">
                <span className="font-bold">Total atual:</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{selectedProduto.quantidade} un</span>
              </div>
              
              {historicoMovimentacoes.length === 0 ? (
                <div className="text-center py-6 text-slate-400">Nenhuma movimentação registrada.</div>
              ) : (
                historicoMovimentacoes.map(mov => {
                  let colorClass = 'text-blue-600 dark:text-blue-400';
                  let bgClass = 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800';
                  let symbol = '';
                  
                  if (mov.tipo === 'entrada') {
                    colorClass = 'text-emerald-600 dark:text-emerald-400';
                    bgClass = 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50';
                    symbol = '+';
                  } else if (mov.tipo === 'saida') {
                    colorClass = 'text-rose-600 dark:text-rose-400';
                    bgClass = 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50';
                    symbol = '-';
                  }
                  
                  // fallback if it's an adjustment
                  if (mov.motivo && mov.motivo.toLowerCase().includes('ajuste')) {
                    colorClass = 'text-blue-600 dark:text-blue-400';
                    bgClass = 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50';
                  }

                  return (
                    <div key={mov.id} className={`p-3 rounded-2xl border flex justify-between items-center ${bgClass}`}>
                      <div>
                        <span className={`font-extrabold block uppercase text-[10px] ${colorClass}`}>
                          {mov.tipo}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {mov.motivo || 'Movimentação padrão'}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {new Date(mov.created_at).toLocaleString()}
                          </span>
                          {mov.profissional_nome && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">
                              {mov.profissional_nome}
                            </span>
                          )}
                        </div>
                      </div>
                      <strong className={`text-sm ${colorClass}`}>
                        {symbol}{mov.quantidade}
                      </strong>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}