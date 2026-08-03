import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Plus, Package, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';

export function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Wizard Modal
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [form, setForm] = useState({
    nome: '',
    tipo: 'consumo',
    quantidade: 10,
    estoque_minimo: 3,
    custo_unitario: 15.0,
    imagem_url: '',
  });

  // Movement Modal
  const [showMovement, setShowMovement] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movForm, setMovForm] = useState({ tipo: 'entrada', quantidade: 1, motivo: '' });

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/estoque/produtos');
      setProdutos(res.produtos || []);
    } catch (err) {
      console.error('[ESTOQUE ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWizard = () => {
    setWizardStep(1);
    setForm({ nome: '', tipo: 'consumo', quantidade: 10, estoque_minimo: 3, custo_unitario: 15.0, imagem_url: '' });
    setShowWizard(true);
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
      fetchProdutos();
    } catch (err) {
      alert(err.message || 'Erro ao cadastrar produto.');
    }
  };

  const handleMovement = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/estoque/movimentacoes', 'POST', {
        produto_id: selectedProduct.id,
        tipo: movForm.tipo,
        quantidade: parseInt(movForm.quantidade, 10),
        motivo: movForm.motivo,
      });
      setShowMovement(false);
      fetchProdutos();
    } catch (err) {
      alert(err.message || 'Erro ao registrar movimentação.');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Controle de Estoque</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Inventário de produtos, insumos e movimentações</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenWizard}>
          <Plus size={16} /> Wizard de Novo Produto
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Carregando estoque...</div>
      ) : produtos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <Package size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>Nenhum produto cadastrado no estoque.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {produtos.map((p) => {
            const isLow = p.quantidade <= p.estoque_minimo && p.estoque_minimo > 0;
            return (
              <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>{p.nome}</h3>
                    <span className="badge badge-warning" style={{ textTransform: 'capitalize' }}>{p.tipo}</span>
                  </div>

                  {isLow && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-color)', fontSize: 13, marginBottom: 8 }}>
                      <AlertTriangle size={14} /> Reposição Necessária
                    </div>
                  )}

                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Saldo em Estoque: <strong style={{ color: isLow ? 'var(--accent-color)' : 'var(--text-main)' }}>{p.quantidade} un</strong>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Mínimo: {p.estoque_minimo} un • Custo: R$ {parseFloat(p.custo_unitario).toFixed(2)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="btn btn-secondary" style={{ flex: 1, padding: 6, fontSize: 13 }} onClick={() => { setSelectedProduct(p); setMovForm({ tipo: 'entrada', quantidade: 1, motivo: '' }); setShowMovement(true); }}>
                    <ArrowUpRight size={14} color="var(--success)" /> Entrada
                  </button>
                  <button className="btn btn-secondary" style={{ flex: 1, padding: 6, fontSize: 13 }} onClick={() => { setSelectedProduct(p); setMovForm({ tipo: 'saida', quantidade: 1, motivo: '' }); setShowMovement(true); }}>
                    <ArrowDownRight size={14} color="var(--danger)" /> Saída
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Wizard 3 Passos */}
      {showWizard && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18 }}>Passo {wizardStep} de 3 — Cadastro de Produto</h3>
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: wizardStep >= 1 ? 'var(--primary-color)' : 'var(--card-border)' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: wizardStep >= 2 ? 'var(--primary-color)' : 'var(--card-border)' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: wizardStep >= 3 ? 'var(--primary-color)' : 'var(--card-border)' }} />
              </div>
            </div>

            {wizardStep === 1 && (
              <div>
                <div className="form-group">
                  <label>Nome do Produto / Insumo</label>
                  <input className="form-input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="ex: Shampoo Neutro 1L" required />
                </div>
                <div className="form-group">
                  <label>Tipo de Produto</label>
                  <select className="form-input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                    <option value="consumo">Consumo / Atendimento</option>
                    <option value="venda">Revenda para Cliente</option>
                    <option value="ferramenta">Equipamento / Ferramenta</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                  <button className="btn btn-secondary" onClick={() => setShowWizard(false)}>Cancelar</button>
                  <button className="btn btn-primary" onClick={() => { if (form.nome) setWizardStep(2); else alert('Informe o nome do produto.'); }}>Próximo &rarr;</button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div>
                <div className="form-group">
                  <label>Quantidade Inicial</label>
                  <input type="number" className="form-input" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Estoque Mínimo para Alerta</label>
                  <input type="number" className="form-input" value={form.estoque_minimo} onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 20 }}>
                  <button className="btn btn-secondary" onClick={() => setWizardStep(1)}>&larr; Voltar</button>
                  <button className="btn btn-primary" onClick={() => setWizardStep(3)}>Próximo &rarr;</button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <form onSubmit={handleCreateProduct}>
                <div className="form-group">
                  <label>Custo Unitário (R$)</label>
                  <input type="number" step="0.01" className="form-input" value={form.custo_unitario} onChange={(e) => setForm({ ...form, custo_unitario: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>URL da Imagem do Produto (Opcional)</label>
                  <input className="form-input" value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} placeholder="https://..." />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 20 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setWizardStep(2)}>&larr; Voltar</button>
                  <button type="submit" className="btn btn-primary">Concluir Cadastro</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {showMovement && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Movimentar Estoque — {selectedProduct.nome}</h3>
            <form onSubmit={handleMovement}>
              <div className="form-group">
                <label>Tipo de Movimento</label>
                <select className="form-input" value={movForm.tipo} onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value })}>
                  <option value="entrada">Entrada (+)</option>
                  <option value="saida">Saída (-)</option>
                  <option value="ajuste">Ajuste de Balanço (=)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Quantidade</label>
                <input type="number" className="form-input" value={movForm.quantidade} onChange={(e) => setMovForm({ ...movForm, quantidade: e.target.value })} required min="1" />
              </div>
              <div className="form-group">
                <label>Motivo / Observação</label>
                <input className="form-input" value={movForm.motivo} onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })} placeholder="ex: Compra de insumos" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMovement(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Confirmar Movimento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
