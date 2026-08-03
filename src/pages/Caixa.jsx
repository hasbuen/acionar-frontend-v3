import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Plus, DollarSign, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';

export function Caixa() {
  const [data, setData] = useState({ movimentacoes: [], resumo: { totalEntradas: 0, totalSaidas: 0, saldo: 0 } });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ tipo: 'entrada', descricao: '', valor: '', forma_pagamento: 'pix' });

  useEffect(() => {
    fetchCaixa();
  }, []);

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
      alert(err.message || 'Erro ao registrar movimentação.');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!confirm('Deseja excluir este lançamento do caixa?')) return;
    try {
      await apiRequest(`/caixa/${id}`, 'DELETE');
      fetchCaixa();
    } catch (err) {
      alert('Erro ao excluir lançamento.');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Fluxo de Caixa</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Resumo financeiro e movimentações de caixa</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nova Movimentação
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>Entradas Realizadas</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} /> R$ {data.resumo.totalEntradas.toFixed(2)}
          </div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>Saídas / Despesas</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingDown size={20} /> R$ {data.resumo.totalSaidas.toFixed(2)}
          </div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>Saldo Realizado</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: data.resumo.saldo >= 0 ? 'var(--primary-color)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={20} /> R$ {data.resumo.saldo.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Movimentacoes Table */}
      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Histórico de Lançamentos</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>Carregando caixa...</div>
        ) : data.movimentacoes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum lançamento no período.</div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>DATA</th>
                  <th>DESCRIÇÃO</th>
                  <th>FORMA PAGTO</th>
                  <th>TIPO</th>
                  <th>VALOR</th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {data.movimentacoes.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.data_movimento).toLocaleDateString()}</td>
                    <td>{item.descricao}</td>
                    <td>{item.forma_pagamento.toUpperCase()}</td>
                    <td>
                      <span className={`badge badge-${item.tipo === 'entrada' ? 'success' : 'danger'}`}>
                        {item.tipo.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: item.tipo === 'entrada' ? 'var(--success)' : 'var(--danger)' }}>
                      R$ {parseFloat(item.valor).toFixed(2)}
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: 4 }} onClick={() => handleDeleteEntry(item.id)}>
                        <Trash2 size={14} color="var(--danger)" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Nova Movimentação de Caixa</h3>
            <form onSubmit={handleCreateEntry}>
              <div className="form-group">
                <label>Tipo de Lançamento</label>
                <select className="form-input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option value="entrada">Entrada (+)</option>
                  <option value="saida">Saída (-)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <input className="form-input" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="ex: Pagamento de Corte de Cabelo" required />
              </div>

              <div className="form-group">
                <label>Valor (R$)</label>
                <input type="number" step="0.01" className="form-input" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0.00" required />
              </div>

              <div className="form-group">
                <label>Forma de Pagamento</label>
                <select className="form-input" value={form.forma_pagamento} onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })}>
                  <option value="pix">PIX</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Lançar no Caixa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
