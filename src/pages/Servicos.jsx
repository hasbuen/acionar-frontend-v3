import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Scissors, Plus, Boxes, Edit, Trash2, Clock, DollarSign, X, ChevronRight, Check } from 'lucide-react';
import { ModalAlert, useModalAlert } from '../components/ModalAlert';

export function Servicos({ setActiveTab }) {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModalServico, setShowModalServico] = useState(false);
  const [showModalSubservico, setShowModalSubservico] = useState(false);
  const [selectedServicoId, setSelectedServicoId] = useState(null);
  const [editingServico, setEditingServico] = useState(null);
  const [editingSubservico, setEditingSubservico] = useState(null);
  const { alertState, showAlert, closeAlert } = useModalAlert();

  const handleToggleServicoAtendo = async (servicoId) => {
    try {
      const res = await apiRequest(`/servicos/${servicoId}/toggle-atendo`, 'POST');
      setServicos((prev) =>
        prev.map((s) => (s.id === servicoId ? { ...s, habilitado_profissional: res.habilitado_profissional } : s))
      );
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao alterar opção Atendo.' });
    }
  };

  const handleToggleSubservicoAtendo = async (servicoId, subservicoId) => {
    try {
      const res = await apiRequest(`/servicos/subservicos/${subservicoId}/toggle-atendo`, 'POST');
      setServicos((prev) =>
        prev.map((s) => {
          if (s.id !== servicoId) return s;
          return {
            ...s,
            subservicos: (s.subservicos || []).map((sub) =>
              sub.id === subservicoId ? { ...sub, habilitado_profissional: res.habilitado_profissional } : sub
            ),
          };
        })
      );
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao alterar opção Atendo.' });
    }
  };



  const [formServico, setFormServico] = useState({
    nome: '',
    descricao: '',
    duracao_minutos: 60,
    preco: '',
    foto_url: '',
  });

  const [formSubservico, setFormSubservico] = useState({
    nome: '',
    preco_adicional: '',
    duracao_adicional_minutos: 15,
    foto_url: '',
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

  const handleImageUpload = async (e, type, callback) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        const res = await apiRequest('/config/upload-image', 'POST', {
          type,
          imageBase64: base64
        });
        callback(res.foto_url);
      } catch (err) {
        showAlert({ type: 'error', message: err.message || 'Erro ao enviar foto.' });
      }
    };
  };

  const handleOpenServicoModal = (servico = null) => {
    if (servico) {
      setEditingServico(servico);
      setFormServico({
        nome: servico.nome,
        descricao: servico.descricao || '',
        duracao_minutos: servico.duracao_minutos || 60,
        preco: servico.preco || '',
        foto_url: servico.foto_url || '',
      });
    } else {
      setEditingServico(null);
      setFormServico({ nome: '', descricao: '', duracao_minutos: 60, preco: '', foto_url: '' });
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
          showAlert({ type: 'error', message: err.message || 'Erro ao excluir serviço.' });
        }

      }
    });
  };

  const handleOpenSubservicoModal = (servicoId, subservico = null) => {
    setSelectedServicoId(servicoId);
    if (subservico) {
      setEditingSubservico(subservico);
      setFormSubservico({
        nome: subservico.nome,
        preco_adicional: subservico.preco_adicional || '',
        duracao_adicional_minutos: subservico.duracao_adicional_minutos || 15,
        foto_url: subservico.foto_url || '',
      });
    } else {
      setEditingSubservico(null);
      setFormSubservico({ nome: '', preco_adicional: '', duracao_adicional_minutos: 15, foto_url: '' });
    }
    setShowModalSubservico(true);
  };

  const handleSaveSubservico = async (e) => {
    e.preventDefault();
    try {
      if (editingSubservico) {
        await apiRequest(`/servicos/${selectedServicoId}/subservicos/${editingSubservico.id}`, 'PUT', {
          ...formSubservico,
          duracao_adicional_minutos: parseInt(formSubservico.duracao_adicional_minutos || 0, 10),
          preco_adicional: parseFloat(formSubservico.preco_adicional || 0),
        });
      } else {
        await apiRequest(`/servicos/${selectedServicoId}/subservicos`, 'POST', {
          ...formSubservico,
          duracao_adicional_minutos: parseInt(formSubservico.duracao_adicional_minutos || 0, 10),
          preco_adicional: parseFloat(formSubservico.preco_adicional || 0),
        });
      }
      setShowModalSubservico(false);
      fetchServicos();
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao salvar subserviço.' });
    }
  };

  const handleDeleteSubservico = (servicoId, subId) => {
    showAlert({
      type: 'warning',
      title: 'Excluir adicional',
      message: 'Deseja excluir este adicional?',
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        closeAlert();
        try {
          await apiRequest(`/servicos/${servicoId}/subservicos/${subId}`, 'DELETE');
          fetchServicos();
        } catch (err) {
          showAlert({ type: 'error', message: err.message || 'Erro ao excluir adicional.' });
        }

      }
    });
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
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {s.foto_url ? (
                      <img src={s.foto_url} alt={s.nome} className="h-12 w-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                    ) : (
                      <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                        <Scissors className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">{s.nome}</h3>
                      <button
                        type="button"
                        onClick={() => handleToggleServicoAtendo(s.id)}
                        className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[11px] font-black transition-all ${
                          s.habilitado_profissional !== false
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                        title={s.habilitado_profissional !== false ? 'Deshabilitar este serviço para mim' : 'Habilitar este serviço para mim'}
                      >
                        {s.habilitado_profissional !== false ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        <span>{s.habilitado_profissional !== false ? 'Atendo' : 'Habilitar'}</span>
                      </button>
                    </div>
                  </div>
                  <span className="text-lg font-black text-emerald-400 shrink-0">
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
                  <div className="space-y-2">
                    {s.subservicos.map((sub) => (
                      <div key={sub.id} className="rounded-xl bg-slate-100 dark:bg-slate-950 p-2.5 text-xs space-y-1.5 border border-slate-200/50 dark:border-slate-800/50">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {sub.foto_url && (
                              <img src={sub.foto_url} alt={sub.nome} className="h-7 w-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleSubservicoAtendo(s.id, sub.id)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black shrink-0 transition-all ${
                                sub.habilitado_profissional !== false
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                              title={sub.habilitado_profissional !== false ? 'Deshabilitar adicional para mim' : 'Habilitar adicional para mim'}
                            >
                              {sub.habilitado_profissional !== false ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                              <span>{sub.habilitado_profissional !== false ? 'Atendo' : 'Habilitar'}</span>
                            </button>
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{sub.nome}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-bold text-teal-400 mr-1">+ R$ {parseFloat(sub.preco_adicional || 0).toFixed(2)}</span>
                            <button
                              onClick={() => handleOpenSubservicoModal(s.id, sub)}
                              className="text-slate-400 hover:text-blue-400 p-2"
                              title="Editar adicional"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubservico(s.id, sub.id)}
                              className="text-slate-400 hover:text-rose-400 p-2"
                              title="Excluir adicional"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>


                        {/* Insumos/Produtos do Subserviço */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/30 dark:border-slate-800/40">
                          <div className="flex items-center gap-1 overflow-hidden">
                            <span className="text-[10px] font-extrabold uppercase text-slate-500">Insumos:</span>
                            {sub.produtos && sub.produtos.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {sub.produtos.map((item) => (
                                  <span key={`${sub.id}-${item.produto_id}`} className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-400">
                                    {item.produto_nome} ×{item.quantidade_usada}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] italic text-slate-500">Nenhum</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleOpenMaterialModal(s, sub)}
                            className="text-[10px] font-bold text-teal-400 hover:underline shrink-0 ml-1"
                          >
                            + vincular produto
                          </button>
                        </div>
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
                  className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-400 text-xs font-bold hover:text-blue-300"
                >
                  <Edit className="h-3.5 w-3.5 inline mr-1" /> Editar
                </button>
                <button
                  onClick={() => handleDeleteServico(s.id)}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-400 text-xs font-bold hover:text-rose-300"
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
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md animate-fade-in"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, transform: 'none' }}
        >
          <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl space-y-4 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button onClick={() => setShowModalServico(false)} className="text-slate-400 hover:text-slate-900 dark:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveServico} className="space-y-4">
              <div className="flex flex-col items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="relative group h-24 w-24 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                  {formServico.foto_url ? (
                    <img src={formServico.foto_url} alt="Serviço" className="h-full w-full object-cover" />
                  ) : (
                    <Scissors className="h-8 w-8 text-slate-400" />
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-black text-white cursor-pointer uppercase tracking-wider">
                    Alterar
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, 'servicos', (url) => setFormServico(prev => ({ ...prev, foto_url: url })))}
                      className="hidden" 
                    />
                  </label>
                </div>
                {formServico.foto_url && (
                  <button 
                    type="button" 
                    onClick={() => setFormServico(prev => ({ ...prev, foto_url: '' }))}
                    className="text-[10px] font-black uppercase text-red-500 hover:text-red-600 transition"
                  >
                    Remover Foto
                  </button>
                )}
              </div>
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
                <button type="button" onClick={() => setShowModalServico(false)} className="px-4 py-3 text-xs font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="px-6 py-3 rounded-2xl bg-blue-600 text-xs font-black text-white shadow-lg shadow-blue-500/25">
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {materialModal && (
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md animate-fade-in"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, transform: 'none' }}
        >
          <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl space-y-4 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500"
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
                <button type="button" onClick={() => setMaterialModal(null)} className="px-4 py-3 text-xs font-bold text-slate-400">Cancelar</button>
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
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md animate-fade-in"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, transform: 'none' }}
        >
          <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl space-y-4 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingSubservico ? 'Editar Subserviço / Adicional' : 'Novo Subserviço / Adicional'}
              </h3>
              <button onClick={() => setShowModalSubservico(false)} className="text-slate-400 hover:text-slate-900 dark:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>


            <form onSubmit={handleSaveSubservico} className="space-y-4">
              <div className="flex flex-col items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="relative group h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                  {formSubservico.foto_url ? (
                    <img src={formSubservico.foto_url} alt="Subserviço" className="h-full w-full object-cover" />
                  ) : (
                    <Boxes className="h-6 w-6 text-slate-400" />
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-black text-white cursor-pointer uppercase tracking-wider">
                    Alterar
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, 'subservicos', (url) => setFormSubservico(prev => ({ ...prev, foto_url: url })))}
                      className="hidden" 
                    />
                  </label>
                </div>
                {formSubservico.foto_url && (
                  <button 
                    type="button" 
                    onClick={() => setFormSubservico(prev => ({ ...prev, foto_url: '' }))}
                    className="text-[10px] font-black uppercase text-red-500 hover:text-red-600 transition"
                  >
                    Remover Foto
                  </button>
                )}
              </div>
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
                <button type="button" onClick={() => setShowModalSubservico(false)} className="px-4 py-3 text-xs font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="px-6 py-3 rounded-2xl bg-teal-600 text-xs font-black text-white shadow-lg shadow-teal-500/25">
                  {editingSubservico ? 'Salvar Adicional' : 'Adicionar Subserviço'}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}