import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Calendar, Clock, User, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export function PublicSchedule({ slug }) {
  const [tenant, setTenant] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Flow State
  const [step, setStep] = useState(1);
  const [selectedServico, setSelectedServico] = useState(null);
  const [selectedSubservico, setSelectedSubservico] = useState(null);
  const [selectedProfissional, setSelectedProfissional] = useState(null);
  const [dataHora, setDataHora] = useState(`${new Date().toISOString().split('T')[0]}T14:00`);

  // Customer Form
  const [clienteNome, setClienteNome] = useState('');
  const [clienteWhatsapp, setClienteWhatsapp] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [observacao, setObservacao] = useState('');

  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    fetchPublicData();
  }, [slug]);

  const fetchPublicData = async () => {
    setLoading(true);
    setError('');
    try {
      const tRes = await apiRequest(`/public/tenant/${slug}`);
      setTenant(tRes.tenant);

      if (tRes.tenant.agenda_publica_ativa) {
        const sRes = await apiRequest(`/public/tenant/${slug}/servicos`);
        const pRes = await apiRequest(`/public/tenant/${slug}/profissionais`);
        setServicos(sRes.servicos || []);
        setProfissionais(pRes.profissionais || []);
      }
    } catch (err) {
      setError(err.message || 'Não foi possível carregar as informações do agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiRequest(`/public/tenant/${slug}/agendamentos`, 'POST', {
        cliente_nome: clienteNome,
        cliente_whatsapp: clienteWhatsapp,
        cliente_email: clienteEmail,
        servico_id: selectedServico.id,
        subservico_id: selectedSubservico ? selectedSubservico.id : null,
        profissional_id: selectedProfissional ? selectedProfissional.id : null,
        data_hora: new Date(dataHora).toISOString(),
        observacao,
      });
      setConfirmedBooking(res.agendamento);
      setStep(4); // Success step
    } catch (err) {
      alert(err.message || 'Erro ao realizar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !tenant) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        Carregando informações da agenda...
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: 400 }}>
          <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: 12 }} />
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Agenda não encontrada</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{error || 'Estabelecimento não cadastrado.'}</p>
        </div>
      </div>
    );
  }

  const primaryColor = tenant.cor_primaria || '#0d9488';
  const accentColor = tenant.cor_destaque || '#f59e0b';
  const bgColor = tenant.cor_fundo || '#0f172a';

  if (!tenant.agenda_publica_ativa) {
    return (
      <div style={{ backgroundColor: bgColor, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: 450 }}>
          {tenant.foto_url && (
            <img src={tenant.foto_url} alt={tenant.nome_empresa} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px' }} />
          )}
          <h1 style={{ fontSize: 22, color: '#fff', marginBottom: 8 }}>{tenant.nome_empresa}</h1>
          <div className="badge badge-warning" style={{ marginBottom: 16 }}>Agenda Online Fechada</div>
          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.5 }}>
            No momento nosso agendamento online está suspenso. Por favor, entre em contato diretamente pelo WhatsApp para verificar disponibilidade de horários.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: bgColor, minHeight: '100vh', color: '#f8fafc', padding: 16 }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(255,255,255,0.1)' }}>
          {tenant.foto_url ? (
            <img src={tenant.foto_url} alt={tenant.nome_empresa} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px' }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: primaryColor, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>
              {tenant.nome_empresa[0]}
            </div>
          )}
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{tenant.nome_empresa}</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Agendamento de Serviços Online</p>
        </div>

        {/* Step 1: Escolha do Serviço */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              1. Selecione o Serviço
            </h2>

            <div style={{ display: 'grid', gap: 12 }}>
              {servicos.map((s) => (
                <div
                  key={s.id}
                  className="card"
                  onClick={() => { setSelectedServico(s); setStep(2); }}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderLeft: selectedServico?.id === s.id ? `4px solid ${primaryColor}` : '1px solid var(--card-border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600 }}>{s.nome}</h3>
                      {s.descricao && <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{s.descricao}</p>}
                      <div style={{ fontSize: 12, color: accentColor, marginTop: 6 }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> {s.duracao_minutos} minutos
                      </div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: primaryColor }}>
                      R$ {parseFloat(s.preco).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Profissional e Horário */}
        {step === 2 && (
          <div>
            <button className="btn btn-secondary" style={{ marginBottom: 16, padding: '6px 12px' }} onClick={() => setStep(1)}>
              <ArrowLeft size={14} /> Voltar para Serviços
            </button>

            <h2 style={{ fontSize: 18, marginBottom: 16 }}>2. Profissional, Data e Horário</h2>

            <div className="card">
              <div className="form-group">
                <label>Profissional de Preferência (Opcional)</label>
                <select className="form-input" value={selectedProfissional?.id || ''} onChange={(e) => setSelectedProfissional(profissionais.find(p => p.id === parseInt(e.target.value, 10)) || null)}>
                  <option value="">Qualquer profissional disponível</option>
                  {profissionais.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Data e Horário do Atendimento</label>
                <input type="datetime-local" className="form-input" value={dataHora} onChange={(e) => setDataHora(e.target.value)} required />
              </div>

              <button className="btn btn-primary" style={{ width: '100%', marginTop: 12, backgroundColor: primaryColor }} onClick={() => setStep(3)}>
                Avançar para Seus Dados &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Dados do Cliente e Confirmação */}
        {step === 3 && (
          <div>
            <button className="btn btn-secondary" style={{ marginBottom: 16, padding: '6px 12px' }} onClick={() => setStep(2)}>
              <ArrowLeft size={14} /> Voltar
            </button>

            <h2 style={{ fontSize: 18, marginBottom: 16 }}>3. Seus Dados de Contato</h2>

            <form onSubmit={handleBookingSubmit} className="card">
              <div className="form-group">
                <label>Seu Nome Completo *</label>
                <input className="form-input" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="ex: Maria Silva" required />
              </div>

              <div className="form-group">
                <label>Seu WhatsApp com DDD *</label>
                <input className="form-input" value={clienteWhatsapp} onChange={(e) => setClienteWhatsapp(e.target.value)} placeholder="(11) 99999-8888" required />
              </div>

              <div className="form-group">
                <label>E-mail (Opcional)</label>
                <input type="email" className="form-input" value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)} placeholder="seu@email.com" />
              </div>

              <div className="form-group">
                <label>Observação (Opcional)</label>
                <textarea className="form-input" rows="2" value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Alguma recomendação ou detalhe especial..." />
              </div>

              {/* Resumo */}
              <div style={{ backgroundColor: '#0f172a', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>RESUMO DO AGENDAMENTO</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{selectedServico?.nome}</div>
                <div style={{ fontSize: 13, color: primaryColor, marginTop: 2 }}>
                  R$ {parseFloat(selectedServico?.preco || 0).toFixed(2)} • {new Date(dataHora).toLocaleString()}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 14, backgroundColor: primaryColor }} disabled={loading}>
                {loading ? 'Confirmando...' : 'Finalizar Solicitação de Agendamento'}
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Confirmação Concluída */}
        {step === 4 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <CheckCircle2 size={56} color={primaryColor} style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Solicitação Enviada!</h2>
            <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
              Sua solicitação de agendamento para <strong>{selectedServico?.nome}</strong> em{' '}
              <strong>{new Date(dataHora).toLocaleString()}</strong> foi recebida com sucesso.
            </p>

            <button className="btn btn-primary" style={{ backgroundColor: primaryColor }} onClick={() => { setStep(1); setConfirmedBooking(null); }}>
              Realizar Novo Agendamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
