import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Plus, Filter, Calendar as CalendarIcon, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';

export function Agenda() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('hoje');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [form, setForm] = useState({
    cliente_id: '',
    servico_id: '',
    data_hora: `${new Date().toISOString().split('T')[0]}T10:00`,
    observacao: '',
  });

  useEffect(() => {
    fetchAgenda();
  }, [filterMode, selectedDate]);

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      let query = '';
      if (filterMode === 'hoje') {
        const today = new Date().toISOString().split('T')[0];
        query = `?data_inicio=${today}T00:00:00.000Z&data_fim=${today}T23:59:59.999Z`;
      } else if (selectedDate) {
        query = `?data_inicio=${selectedDate}T00:00:00.000Z&data_fim=${selectedDate}T23:59:59.999Z`;
      }
      const res = await apiRequest(`/agendamentos${query}`);
      setAgendamentos(res.agendamentos || []);
    } catch (err) {
      console.error('[AGENDA FETCH ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = async () => {
    try {
      const cRes = await apiRequest('/clientes');
      const sRes = await apiRequest('/servicos');
      setClientes(cRes.clientes || []);
      setServicos(sRes.servicos || []);
      setShowModal(true);
    } catch (err) {
      alert('Erro ao carregar dados para agendamento.');
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      const serv = servicos.find(s => s.id === parseInt(form.servico_id, 10));
      await apiRequest('/agendamentos', 'POST', {
        cliente_id: parseInt(form.cliente_id, 10),
        servico_id: parseInt(form.servico_id, 10),
        data_hora: new Date(form.data_hora).toISOString(),
        valor_total: serv ? serv.preco : 0,
        observacao: form.observacao,
        status: 'agendado',
      });
      setShowModal(false);
      fetchAgenda();
    } catch (err) {
      alert(err.message || 'Erro ao criar agendamento.');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await apiRequest(`/agendamentos/${id}`, 'PUT', { status });
      fetchAgenda();
    } catch (err) {
      alert('Erro ao atualizar status.');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Agenda do Dia</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Gerencie atendimentos e agendamentos públicos</p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={16} /> Novo Agendamento
        </button>
      </div>

      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          className={`btn ${filterMode === 'hoje' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterMode('hoje')}
        >
          <CalendarIcon size={16} /> Hoje
        </button>
        <button
          className={`btn ${filterMode === 'data' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterMode('data')}
        >
          <Filter size={16} /> Data Específica
        </button>
        {filterMode === 'data' && (
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Carregando agenda...</div>
      ) : agendamentos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <CalendarIcon size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>Nenhum agendamento encontrado para o período selecionado.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {agendamentos.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Clock size={16} color="var(--primary-color)" />
                  <strong style={{ fontSize: 16 }}>{new Date(item.data_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                  <span className={`badge badge-${item.status === 'agendado' ? 'success' : item.status === 'aguardando_confirmacao' ? 'warning' : 'danger'}`}>
                    {item.status === 'aguardando_confirmacao' ? 'Solicitação Pública' : item.status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)', fontWeight: 600 }}>
                  <User size={16} /> {item.cliente_nome || 'Cliente não identificado'}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
                  Serviço: <strong>{item.servico_nome || 'Atendimento'}</strong> • R$ {parseFloat(item.valor_total).toFixed(2)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {item.status === 'aguardando_confirmacao' && (
                  <button className="btn btn-primary" onClick={() => handleStatusChange(item.id, 'agendado')}>
                    <CheckCircle size={16} /> Confirmar
                  </button>
                )}
                {item.status !== 'concluido' && (
                  <button className="btn btn-secondary" onClick={() => handleStatusChange(item.id, 'concluido')}>
                    Concluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar Agendamento */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Novo Agendamento Interno</h3>
            <form onSubmit={handleCreateAppointment}>
              <div className="form-group">
                <label>Cliente</label>
                <select className="form-input" value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} required>
                  <option value="">Selecione um cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.whatsapp || 'sem zap'})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Serviço</label>
                <select className="form-input" value={form.servico_id} onChange={(e) => setForm({ ...form, servico_id: e.target.value })} required>
                  <option value="">Selecione um serviço...</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome} — R$ {parseFloat(s.preco).toFixed(2)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Data e Horário</label>
                <input type="datetime-local" className="form-input" value={form.data_hora} onChange={(e) => setForm({ ...form, data_hora: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Observação</label>
                <textarea className="form-input" rows="2" value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Detalhes do atendimento..." />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Agendamento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
