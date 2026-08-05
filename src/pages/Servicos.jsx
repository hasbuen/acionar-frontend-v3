import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Scissors, Plus, Boxes, Edit, Trash2, Clock, DollarSign, X, ChevronRight } from 'lucide-react';
import { ModalAlert, useModalAlert } from '../components/ModalAlert';

export function Servicos({ setActiveTab }) {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModalServico, setShowModalServico] = useState(false);
  const [showModalSubservico, setShowModalSubservico] = useState(false);
  const [selectedServicoId, setSelectedServicoId] = useState(null);
  const [editingServico, setEditingServico] = useState(null);
  const { alertState, showAlert, closeAlert } = useModalAlert();

  const [formServico, setFormServico] = useState({
    nome: '',
    descricao: '',
    duracao_minutos: 60,
    preco: '',
  });

  const [formSubservico, setFormSubservico] = useState({
    nome: '',
    preco_adicional: '',
    duracao_adicional_minutos: 15,
  });
  const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);
  const [materialModal, setMaterialModal] = useState(null);
  const [materialForm, setMaterialForm] = useState({ produto_id: '', quantidade_usada: 1 });

  useEffect(() => {
    fetchServicos();
  }, []);

  const fetchServicos = async () => {
    setLoading(true);
    try {
      const [res, produtosRes] = await Promise.all([
        apiRequest('/servicos'),
        apiRequest('/estoque/produtos').catch(() => ({ produtos: [] })),
      ]);
      setServicos(res.servicos || []);
      setProdutosDisponiveis(produtosRes.produtos || []);
    } catch (err) {
      console.error('[SERVICOS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenServicoModal = (servico = null) => {
    if (servico) {
      setEditingServico(servico);
      setFormServico({
        nome: servico.nome,
        descricao: servico.descricao || '',
        duracao_minutos: servico.duracao_minutos || 60,
        preco: servico.preco || '',
      });
    } else {
      setEditingServico(null);
      setFormServico({ nome: '', descricao: '', duracao_minutos: 60, preco: '' });
    }
    setShowModalServico(true);
  };

  const handleSaveServico = async (e) => {
    e.preventDefault();
    try {
      if (editingServico) {
        await apiRequest(`/servicos/${editingServico.id}`, 'PUT', {
          ...formServico,
          duracao_minutos: parseInt(formServico.duracao_minutos, 10),
          preco: parseFloat(formServico.preco),
        });
      } else {
        await apiRequest('/servicos', 'POST', {
          ...formServico,
          duracao_minutos: parseInt(formServico.duracao_minutos, 10),
          preco: parseFloat(formServico.preco),
        });
      }
      setShowModalServico(false);
      fetchServicos();
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao salvar serviço.' });
    }
  };

  const handleDeleteServico = (id) => {
    showAlert({
      type: 'warning',
      title: 'Excluir serviço',
      message: 'Deseja excluir este serviço?',
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        closeAlert();
        try {
          await apiRequest(`/servicos/${id}`, 'DELETE');
          fetchServicos();
        } catch (err) {
          showAlert({ type: 'error', message: 'Erro ao excluir serviço.' });
        }
      }
    });
  };

  const handleOpenSubservicoModal = (servicoId) => {
    setSelectedServicoId(servicoId);
    setFormSubservico({ nome: '', preco_adicional: '', duracao_adicional_minutos: 15 });
    setShowModalSubservico(true);
  };

  const handleSaveSubservico = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/servicos/${selectedServicoId}/subservicos`, 'POST', {
        ...formSubservico,
        duracao_adicional_minutos: parseInt(formSubservico.duracao_adicional_minutos, 10),
        preco_adicional: parseFloat(formSubservico.preco_adicional || 0),
      });
      setShowModalSubservico(false);
      fetchServicos();
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao adicionar subserviço.' });
    }
  };

  const handleOpenMaterialModal = (servico, subservico = null) => {
    setMaterialModal({ servico, subservico });
    setMaterialForm({ produto_id: '', quantidade_usada: 1 });
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    if (!materialModal?.servico || !materialForm.produto_id) return;

    try {
      const endpoint = materialModal.subservico
        ? `/servicos/${materialModal.servico.id}/subservicos/${materialModal.subservico.id}/produtos`
        : `/servicos/${materialModal.servico.id}/produtos`;

      await apiRequest(endpoint, 'POST', {
        produto_id: Number(materialForm.produto_id),
        quantidade_usada: Number(materialForm.quantidade_usada || 1),
      });

      setMaterialModal(null);
      fetchServicos();
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao vincular material.' });
    }
  };

  const handleRemoveMaterial = async (servicoId, produtoId, subservicoId = null) => {
    try {
      const endpoint = subservicoId
        ? `/servicos/${servicoId}/subservicos/${subservicoId}/produtos/${produtoId}`
        : `/servicos/${servicoId}/produtos/${produtoId}`;

      await apiRequest(endpoint, 'DELETE');
      fetchServicos();
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao remover material.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <ModalAlert {...alertState} onClose={closeAlert} />
      {/* Header Banner (Matching servicos.html) */}
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            CONFIGURAÇÃO DE OFERTAS
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Serviços Oferecidos
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Defina durações e tabela de preços para seus atendimentos.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab && setActiveTab('estoque')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 px-4 py-3 text-xs font-black hover:bg-sky-500/20 transition"
          >
            <Boxes className="h-4 w-4" /> Controle de Estoque
          </button>
          <button
            onClick={() => handleOpenServicoModal()}
            className="flex-1 sm:flex-none btn-animated inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-500/25"
          >
            <Scissors className="h-4 w-4" /> Novo Serviço
          </button>
        </div>
      </div>

      {/* Grid de Serviços */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando serviços...</div>
      ) : servicos.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900/40">
          <Scissors className="mx-auto h-12 w-12 opacity-30 mb-3" />
          <p className="font-semibold text-sm">Nenhum serviço cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {servicos.map((s) => (
            <div
              key={s.id}
              className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60 flex flex-col justify-between gap-4 animate-fade-in"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{s.nome}</h3>
                  <span className="text-lg font-black text-emerald-400">
                    R$ {parseFloat(s.preco).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                {s.descricao && (
                  <p className="text-xs text-slate-400 mt-1">{s.descricao}</p>
                )}
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                  <span>Duração: {s.duracao_minutos} minutos</span>
                </div>
              </div>

              {/* Subserviços List */}
              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">SUBSERVIÇOS / ADICIONAIS</span>
                  <button
                    onClick={() => handleOpenSubservicoModal(s.id)}
                    className="text-[10px] font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Adicional
                  </button>
                </div>

                {s.subservicos && s.subservicos.length > 0 ? (
                  <div className="space-y-1.5">
                    {s.subservicos.map((sub) => (
                      <div key={sub.id} className="rounded-xl bg-slate-100 dark:bg-slate-950 p-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-300">{sub.nome}</span>
                          <span className="font-bold text-teal-400">+ R$ {parseFloat(sub.preco_adicional || 0).toFixed(2)}</span>
                        </div>
                        {sub.produtos && sub.produtos.length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {sub.produtos.map((item) => (
                              <span key={`${sub.id}-${item.produto_id}`} className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                                {item.produto_nome} ×{item.quantidade_usada}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] italic text-slate-500">Nenhum adicional cadastrado.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">MATERIAIS</span>
                  <button
                    onClick={() => handleOpenMaterialModal(s)}
                    className="text-[10px] font-bold text-blue-400 hover:underline"
                  >
                    + vincular
                  </button>
                </div>
                {s.produtos && s.produtos.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {s.produtos.map((item) => (
                      <span key={`${s.id}-${item.produto_id}`} className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                        {item.produto_nome} ×{item.quantidade_usada}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] italic text-slate-500">Vincule os insumos usados nesse serviço.</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                <button
                  onClick={() => handleOpenServicoModal(s)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-400 text-xs font-bold hover:text-blue-300"
                >
                  <Edit className="h-3.5 w-3.5 inline mr-1" /> Editar
                </button>
                <button
                  onClick={() => handleDeleteServico(s.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-400 text-xs font-bold hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5 inline mr-1" /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo / Editar Serviço */}
      {showModalServico && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/15 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button onClick={() => setShowModalServico(false)} className="text-slate-400 hover:text-slate-900 dark:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveServico} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">NOME DO SERVIÇO</label>
                <input
                  type="text"
                  value={formServico.nome}
                  onChange={(e) => setFormServico({ ...formServico, nome: e.target.value })}
                  placeholder="Ex: Extensão de Cílios Volume Luxo"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">DESCRIÇÃO</label>
                <textarea
                  rows="2"
                  value={formServico.descricao}
                  onChange={(e) => setFormServico({ ...formServico, descricao: e.target.value })}
                  placeholder="Descrição detalhada do atendimento..."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">DURAÇÃO (MIN)</label>
                  <input
                    type="number"
                    value={formServico.duracao_minutos}
                    onChange={(e) => setFormServico({ ...formServico, duracao_minutos: e.target.value })}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">PREÇO (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formServico.preco}
                    onChange={(e) => setFormServico({ ...formServico, preco: e.target.value })}
                    placeholder="180.00"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModalServico(false)} className="px-4 py-2 text-xs font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="px-6 py-3 rounded-2xl bg-blue-600 text-xs font-black text-white shadow-lg shadow-blue-500/25">
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {materialModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/15 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Vincular material</h3>
                <p className="text-xs text-slate-400">
                  {materialModal.subservico
                    ? `Adicional: ${materialModal.subservico.nome}`
                    : `Serviço: ${materialModal.servico.nome}`}
                </p>
              </div>
              <button onClick={() => setMaterialModal(null)} className="text-slate-400 hover:text-slate-900 dark:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Materiais já vinculados</p>
                {(materialModal.subservico ? (materialModal.subservico.produtos || []) : (materialModal.servico.produtos || [])).length > 0 ? (
                  <div className="space-y-2">
                    {(materialModal.subservico ? (materialModal.subservico.produtos || []) : (materialModal.servico.produtos || [])).map((item) => (
                      <div key={`${materialModal.servico.id}-${item.produto_id}`} className="flex items-center justify-between rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-300">
                        <span>{item.produto_nome}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-teal-400">×{item.quantidade_usada}</span>
                          <button type="button" onClick={() => handleRemoveMaterial(materialModal.servico.id, item.produto_id, materialModal.subservico?.id)} className="text-xs font-bold text-rose-400">
                            remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Ainda não há materiais vinculados.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_0.8fr] gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">PRODUTO</label>
                  <select
                    value={materialForm.produto_id}
                    onChange={(e) => setMaterialForm({ ...materialForm, produto_id: e.target.value })}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">Selecione um insumo</option>
                    {produtosDisponiveis.map((produto) => (
                      <option key={produto.id} value={produto.id}>
                        {produto.nome} — {produto.quantidade} em estoque
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">QTD.</label>
                  <input
                    type="number"
                    min="1"
                    value={materialForm.quantidade_usada}
                    onChange={(e) => setMaterialForm({ ...materialForm, quantidade_usada: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setMaterialModal(null)} className="px-4 py-2 text-xs font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="px-6 py-3 rounded-2xl bg-blue-600 text-xs font-black text-white shadow-lg shadow-blue-500/25">
                  Salvar material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Subserviço */}
      {showModalSubservico && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/15 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Novo Subserviço / Adicional</h3>
              <button onClick={() => setShowModalSubservico(false)} className="text-slate-400 hover:text-slate-900 dark:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubservico} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">NOME DO ADICIONAL</label>
                <input
                  type="text"
                  value={formSubservico.nome}
                  onChange={(e) => setFormSubservico({ ...formSubservico, nome: e.target.value })}
                  placeholder="Ex: Remoção de Cílios Antigos"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">DURAÇÃO ADICIONAL (MIN)</label>
                  <input
                    type="number"
                    value={formSubservico.duracao_adicional_minutos}
                    onChange={(e) => setFormSubservico({ ...formSubservico, duracao_adicional_minutos: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">PREÇO ADICIONAL (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formSubservico.preco_adicional}
                    onChange={(e) => setFormSubservico({ ...formSubservico, preco_adicional: e.target.value })}
                    placeholder="30.00"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModalSubservico(false)} className="px-4 py-2 text-xs font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="px-6 py-3 rounded-2xl bg-teal-600 text-xs font-black text-white shadow-lg shadow-teal-500/25">
                  Adicionar Subserviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

