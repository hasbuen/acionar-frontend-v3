import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Plus, Package, ArrowDown, ArrowUp, ArrowRightLeft, ClipboardCheck, History, AlertTriangle, Search, X, Check, DollarSign } from 'lucide-react';

export function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBaixo, setFilterBaixo] = useState(false);

  // Modals
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const [showMovimento, setShowMovimento] = useState(false);
  const [showInventario, setShowInventario] = useState(false);
  const [showTransferencia, setShowTransferencia] = useState(false);
  const [showRazao, setShowRazao] = useState(false);

  const [selectedProduto, setSelectedProduto] = useState(null);

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
  });

  // Form Movimento
  const [movForm, setMovForm] = useState({
    tipo: 'entrada',
    quantidade: 1,
    motivo: '',
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
      alert(err.message || 'Erro ao cadastrar produto.');
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
      });
      setShowMovimento(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Erro ao registrar movimentação.');
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
      alert('Erro ao salvar inventário.');
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
      {/* Banner de Boas-vindas (Identical to estoque.html) */}
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
            className="btn-animated px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
          >
            <ClipboardCheck className="h-4 w-4 text-purple-500" /> Inventário
          </button>
          <button
            onClick={() => setShowTransferencia(true)}
            className="btn-animated px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
          >
            <ArrowRightLeft className="h-4 w-4 text-sky-500" /> Enviar
          </button>
          <button
            onClick={() => { setSelectedProduto(produtos[0] || null); setMovForm({ tipo: 'entrada', quantidade: 1, motivo: '' }); setShowMovimento(true); }}
            className="btn-animated px-4 py-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold flex items-center justify-center gap-1.5 border border-emerald-500/20"
          >
            <ArrowDown className="h-4 w-4" /> Entrada
          </button>
          <button
            onClick={() => { setWizardStep(1); setForm({ nome: '', tipo: 'consumo', codigo: '', categoria: 'Geral', quantidade: 10, estoque_minimo: 3, custo_unitario: 15.0, imagem_url: '', localizacao: '' }); handleGerarSku(); setShowWizard(true); }}
            className="btn-animated px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1.5"
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
          <span className="text-[10px] font-black uppercase text-slate-500">TOTAL DE PRODUTOS</span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalItens}</h3>
        </div>

        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 shadow-sm backdrop-blur-md">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg mb-2">
            <DollarSign className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-500">VALOR EM ESTOQUE</span>
          <h3 className="text-xl font-black text-emerald-500 mt-0.5">R$ {valorTotalCusto.toFixed(2)}</h3>
        </div>

        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 shadow-sm backdrop-blur-md">
          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-lg mb-2 ${alertasBaixo > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-500">ALERTAS DE ESTOQUE</span>
          <h3 className={`text-xl font-black mt-0.5 ${alertasBaixo > 0 ? 'text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {alertasBaixo} {alertasBaixo === 1 ? 'produto' : 'produtos'}
          </h3>
        </div>

        <div className="rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 shadow-sm backdrop-blur-md">
          <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-lg mb-2">
            <History className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-500">ESTADO DO ESTOQUE</span>
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
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 pl-11 pr-4 py-3 text-xs font-semibold outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={() => setFilterBaixo(!filterBaixo)}
          className={`px-4 py-3 rounded-2xl border text-xs font-extrabold transition ${
            filterBaixo
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-400'
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
                    <div>
                      <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                        {p.tipo || 'CONSUMO'}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{p.nome}</h3>
                      {p.codigo && <span className="text-[11px] font-mono text-slate-500">{p.codigo}</span>}
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      isBaixo ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {p.quantidade} un
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1 mt-3">
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

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => { setSelectedProduto(p); setMovForm({ tipo: 'entrada', quantidade: 1, motivo: '' }); setShowMovimento(true); }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-extrabold hover:bg-emerald-500/20"
                  >
                    + Entrada
                  </button>
                  <button
                    onClick={() => { setSelectedProduto(p); setMovForm({ tipo: 'saida', quantidade: 1, motivo: '' }); setShowMovimento(true); }}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-extrabold hover:bg-rose-500/20"
                  >
                    - Saída
                  </button>
                  <button
                    onClick={() => { setSelectedProduto(p); setShowRazao(true); }}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white"
                    title="Histórico / Extrato"
                  >
                    <History className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: WIZARD NOVO PRODUTO (3 PASSOS) */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">WIZARD DE PRODUTO — PASSO {wizardStep}/3</span>
                <h3 className="text-lg font-black text-white">Cadastrar Novo Produto</h3>
              </div>
              <button onClick={() => setShowWizard(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">NOME DO PRODUTO</label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Ex: Cílios Volume Brasileiro"
                      required
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">SKU / CÓDIGO</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.codigo}
                        onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                        className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                      />
                      <button type="button" onClick={handleGerarSku} className="px-3 py-2 rounded-2xl bg-slate-800 text-xs font-bold text-slate-300">
                        Gerar SKU
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">TIPO</label>
                    <select
                      value={form.tipo}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                    >
                      <option value="consumo">Consumo Interno (Insumo)</option>
                      <option value="venda">Revenda para Cliente</option>
                    </select>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">QUANTIDADE INICIAL</label>
                    <input
                      type="number"
                      value={form.quantidade}
                      onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">ESTOQUE MÍNIMO PARA ALERTA</label>
                    <input
                      type="number"
                      value={form.estoque_minimo}
                      onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">CUSTO UNITÁRIO (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.custo_unitario}
                      onChange={(e) => setForm({ ...form, custo_unitario: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">LOCALIZAÇÃO NO ESTABELECIMENTO</label>
                    <input
                      type="text"
                      value={form.localizacao}
                      onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
                      placeholder="Ex: Armário A, Prateleira 2"
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">URL DA IMAGEM DO PRODUTO (OPCIONAL)</label>
                    <input
                      type="text"
                      value={form.imagem_url}
                      onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3">
                {wizardStep > 1 ? (
                  <button type="button" onClick={() => setWizardStep(wizardStep - 1)} className="px-4 py-2.5 rounded-2xl bg-slate-800 text-xs font-bold text-slate-300">
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
        </div>
      )}

      {/* MODAL 2: MOVIMENTAÇÃO ENTRADA / SAÍDA */}
      {showMovimento && selectedProduto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-400">REGISTRAR MOVIMENTAÇÃO</span>
                <h3 className="text-lg font-black text-white">{selectedProduto.nome}</h3>
              </div>
              <button onClick={() => setShowMovimento(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarMovimento} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">TIPO DE MOVIMENTO</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovForm({ ...movForm, tipo: 'entrada' })}
                    className={`py-3 rounded-2xl text-xs font-black ${movForm.tipo === 'entrada' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                  >
                    + ENTRADA
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovForm({ ...movForm, tipo: 'saida' })}
                    className={`py-3 rounded-2xl text-xs font-black ${movForm.tipo === 'saida' ? 'bg-rose-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                  >
                    - SAÍDA
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">QUANTIDADE</label>
                <input
                  type="number"
                  min="1"
                  value={movForm.quantidade}
                  onChange={(e) => setMovForm({ ...movForm, quantidade: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">MOTIVO / OBSERVAÇÃO</label>
                <input
                  type="text"
                  value={movForm.motivo}
                  onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })}
                  placeholder="Ex: Compra de reposição..."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                />
              </div>

              <button type="submit" className="w-full py-3.5 rounded-2xl bg-blue-600 text-xs font-black text-white">
                Confirmar Movimentação
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INVENTÁRIO GUIADO */}
      {showInventario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 animate-scale-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-400">AJUSTE RÁPIDO</span>
                <h3 className="text-lg font-black text-white">Inventário Guiado em Lote</h3>
              </div>
              <button onClick={() => setShowInventario(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {produtos.map(p => (
                <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-white">{p.nome}</h4>
                    <span className="text-[10px] text-slate-400">Atual: {p.quantidade} un</span>
                  </div>
                  <input
                    type="number"
                    value={inventarioData[p.id] ?? p.quantidade}
                    onChange={(e) => setInventarioData({ ...inventarioData, [p.id]: e.target.value })}
                    className="w-24 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-black text-white text-center"
                  />
                </div>
              ))}
            </div>

            <button onClick={handleSalvarInventario} className="w-full py-3.5 rounded-2xl bg-purple-600 text-xs font-black text-white">
              ✓ Salvar Ajuste de Inventário
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: RAZÃO / HISTÓRICO */}
      {showRazao && selectedProduto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-400">EXTRATO DE MOVIMENTAÇÕES</span>
                <h3 className="text-lg font-black text-white">{selectedProduto.nome}</h3>
              </div>
              <button onClick={() => setShowRazao(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2 max-h-60 overflow-y-auto">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-emerald-400 block">+ Entrada Inicial</span>
                  <span className="text-[10px] text-slate-400">{new Date(selectedProduto.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
                <strong className="text-white">{selectedProduto.quantidade} un</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
