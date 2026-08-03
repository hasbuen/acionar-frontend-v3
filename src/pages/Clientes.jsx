import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Plus, User, Phone, Mail, Edit } from 'lucide-react';

export function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nome: '', whatsapp: '', email: '', observacoes: '' });

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
      setEditingId(cliente.id);
      setForm({ nome: cliente.nome, whatsapp: cliente.whatsapp || '', email: cliente.email || '', observacoes: cliente.observacoes || '' });
    } else {
      setEditingId(null);
      setForm({ nome: '', whatsapp: '', email: '', observacoes: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiRequest(`/clientes/${editingId}`, 'PUT', form);
      } else {
        await apiRequest('/clientes', 'POST', form);
      }
      setShowModal(false);
      fetchClientes();
    } catch (err) {
      alert(err.message || 'Erro ao salvar cliente.');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Gestão de Clientes</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Base unificada de contatos do estabelecimento</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Cadastrar Cliente
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Carregando clientes...</div>
      ) : clientes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <User size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>Nenhum cliente cadastrado até o momento.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>NOME</th>
                  <th>WHATSAPP</th>
                  <th>E-MAIL</th>
                  <th>OBSERVAÇÕES</th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.nome}</td>
                    <td>{c.whatsapp || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.observacoes || '—'}</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px' }} onClick={() => handleOpenModal(c)}>
                        <Edit size={14} /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome Completo</label>
                <input className="form-input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>WhatsApp / Telefone</label>
                <input className="form-input" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(11) 99999-8888" />
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="cliente@email.com" />
              </div>
              <div className="form-group">
                <label>Observações / Preferências</label>
                <textarea className="form-input" rows="2" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
