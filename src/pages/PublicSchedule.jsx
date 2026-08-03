import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Clock, User, Phone, CheckCircle2, ChevronRight, ChevronLeft, MapPin, Building2 } from 'lucide-react';

export function PublicSchedule({ slug: propSlug }) {
  const slug = propSlug || window.location.pathname.split('/agendar/')[1]?.split('/')[0];
  const [tenant, setTenant] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Step state
  const [step, setStep] = useState(1);
  const [selectedServico, setSelectedServico] = useState(null);
  const [selectedSubservico, setSelectedSubservico] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('14:00');

  // Form
  const [form, setForm] = useState({
    cliente_nome: '',
    cliente_whatsapp: '',
    cliente_email: '',
    observacao: '',
  });

  const [bookingResult, setBookingResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchTenantPublicData();
    }
  }, [slug]);

  const fetchTenantPublicData = async () => {
    setLoading(true);
    setError('');
    try {
      const resT = await fetch(`/api/public/tenant/${slug}`);
      if (!resT.ok) throw new Error('Estabelecimento não encontrado ou fora do ar.');
      const dataT = await resT.json();
      setTenant(dataT.tenant);

      const resS = await fetch(`/api/public/tenant/${slug}/servicos`);
      const dataS = await resS.json();
      setServicos(dataS.servicos || []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados do agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dataHoraIso = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

      const res = await fetch(`/api/public/tenant/${slug}/agendamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          servico_id: selectedServico.id,
          subservico_id: selectedSubservico?.id || null,
          data_hora: dataHoraIso,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao realizar agendamento.');

      setBookingResult(data.agendamento);
      setStep(5);
    } catch (err) {
      alert(err.message || 'Erro ao finalizar agendamento.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-400">Carregando agendamento online...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant?.agenda_publica_ativa) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black">Agenda Indisponível</h2>
          <p className="text-xs text-slate-400">{error || 'A agenda pública deste estabelecimento está fechada no momento.'}</p>
        </div>
      </div>
    );
  }

  // Dynamic Colors from Tenant Settings
  const primaryColor = tenant.cor_primaria || '#2563eb';
  const accentColor = tenant.cor_destaque || '#f59e0b';
  const bgColor = tenant.cor_fundo || '#0f172a';

  return (
    <div className="min-h-screen text-slate-100 p-4 sm:p-6" style={{ backgroundColor: bgColor }}>
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header Branding */}
        <div className="text-center space-y-3 pt-4">
          <div className="relative inline-block">
            {tenant.foto_url ? (
              <img src={tenant.foto_url} alt={tenant.nome_empresa} className="h-24 w-24 rounded-3xl object-cover mx-auto ring-4 ring-white/10 shadow-2xl" />
            ) : (
              <div
                className="h-24 w-24 rounded-3xl flex items-center justify-center text-white font-black text-3xl mx-auto shadow-2xl ring-4 ring-white/10"
                style={{ backgroundColor: primaryColor }}
              >
                {tenant.nome_empresa[0]}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">{tenant.nome_empresa}</h1>
            <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: accentColor }}>
              AGENDAMENTO ONLINE
            </p>
          </div>
        </div>

        {/* Step Indicator Bar */}
        <div className="flex items-center justify-between rounded-2xl bg-slate-900/80 p-3 border border-slate-800 text-xs font-extrabold backdrop-blur-md">
          {[1, 2, 3, 4].map((s) => {
            const isActive = step === s;
            const isDone = step > s;
            return (
              <div key={s} className="flex items-center gap-1.5" style={{ color: isActive ? primaryColor : isDone ? accentColor : '#64748b' }}>
                <span
                  className="h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-black"
                  style={{
                    backgroundColor: isActive ? primaryColor : isDone ? accentColor + '30' : '#1e293b',
                    color: isActive ? '#ffffff' : isDone ? accentColor : '#64748b'
                  }}
                >
                  {s}
                </span>
                <span className="hidden sm:inline">
                  {s === 1 ? 'Serviço' : s === 2 ? 'Adicionais' : s === 3 ? 'Data & Hora' : 'Seus Dados'}
                </span>
              </div>
            );
          })}
        </div>

        {/* STEP 1: SERVIÇOS */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-base font-black text-white">1. Selecione o Serviço Desejado</h2>
            <div className="space-y-3">
              {servicos.map((s) => {
                const isSelected = selectedServico?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedServico(s)}
                    className="rounded-3xl p-5 border cursor-pointer transition-all bg-slate-900/80 hover:border-slate-700"
                    style={{
                      borderColor: isSelected ? primaryColor : '#1e293b',
                      backgroundColor: isSelected ? primaryColor + '15' : 'rgba(15, 23, 42, 0.8)',
                      boxShadow: isSelected ? `0 10px 25px ${primaryColor}20` : 'none'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-black text-white">{s.nome}</h3>
                        {s.descricao && <p className="text-xs text-slate-400 mt-1">{s.descricao}</p>}
                        <span className="inline-block mt-2 text-[11px] font-bold text-slate-400">⏱️ {s.duracao_minutos} min</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black" style={{ color: accentColor }}>
                          R$ {parseFloat(s.preco).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              disabled={!selectedServico}
              onClick={() => setStep(2)}
              className="w-full py-4 rounded-2xl font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2 mt-4 shadow-xl transition btn-animated"
              style={{ backgroundColor: primaryColor, color: '#ffffff' }}
            >
              Continuar <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* STEP 2: ADICIONAIS / SUBSERVIÇOS */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-base font-black text-white">2. Algum Adicional / Subserviço?</h2>

            <div
              onClick={() => setSelectedSubservico(null)}
              className="rounded-3xl p-4 border cursor-pointer transition-all bg-slate-900/80"
              style={{
                borderColor: selectedSubservico === null ? primaryColor : '#1e293b',
                backgroundColor: selectedSubservico === null ? primaryColor + '15' : 'rgba(15, 23, 42, 0.8)'
              }}
            >
              <h3 className="text-sm font-black text-white">Nenhum adicional</h3>
              <p className="text-xs text-slate-400">Apenas o serviço principal selecionado.</p>
            </div>

            {selectedServico?.subservicos?.map((sub) => {
              const isSelected = selectedSubservico?.id === sub.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubservico(sub)}
                  className="rounded-3xl p-4 border cursor-pointer transition-all bg-slate-900/80"
                  style={{
                    borderColor: isSelected ? primaryColor : '#1e293b',
                    backgroundColor: isSelected ? primaryColor + '15' : 'rgba(15, 23, 42, 0.8)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-white">{sub.nome}</h3>
                      <span className="text-xs text-slate-400">+ {sub.duracao_adicional_minutos || 0} min</span>
                    </div>
                    <span className="text-sm font-black" style={{ color: accentColor }}>
                      + R$ {parseFloat(sub.preco_adicional || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="w-1/3 py-3.5 rounded-2xl bg-slate-800 font-bold text-xs">Voltar</button>
              <button
                onClick={() => setStep(3)}
                className="w-2/3 py-3.5 rounded-2xl font-black text-xs shadow-xl btn-animated"
                style={{ backgroundColor: primaryColor, color: '#ffffff' }}
              >
                Avançar para Data
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DATA & HORÁRIO */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-base font-black text-white">3. Escolha a Data e Horário</h2>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">DATA DO ATENDIMENTO</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-sm font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">HORÁRIO DISPONÍVEL</label>
              <div className="grid grid-cols-4 gap-2">
                {['09:00', '10:30', '14:00', '15:30', '17:00', '18:30'].map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className="py-3 rounded-2xl text-xs font-black transition-all border"
                      style={{
                        backgroundColor: isSelected ? primaryColor : '#0f172a',
                        color: isSelected ? '#ffffff' : '#94a3b8',
                        borderColor: isSelected ? primaryColor : '#1e293b'
                      }}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="w-1/3 py-3.5 rounded-2xl bg-slate-800 font-bold text-xs">Voltar</button>
              <button
                onClick={() => setStep(4)}
                className="w-2/3 py-3.5 rounded-2xl font-black text-xs shadow-xl btn-animated"
                style={{ backgroundColor: primaryColor, color: '#ffffff' }}
              >
                Preencher Dados
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SEUS DADOS */}
        {step === 4 && (
          <form onSubmit={handleConfirmBooking} className="space-y-4 animate-fade-in">
            <h2 className="text-base font-black text-white">4. Seus Dados de Contato</h2>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">SEU NOME COMPLETO</label>
              <input
                type="text"
                value={form.cliente_nome}
                onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })}
                placeholder="Ex: Fernanda Oliveira"
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-sm font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">SEU WHATSAPP</label>
              <input
                type="text"
                value={form.cliente_whatsapp}
                onChange={(e) => setForm({ ...form, cliente_whatsapp: e.target.value })}
                placeholder="(11) 98765-4321"
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-sm font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">SEU E-MAIL (OPCIONAL)</label>
              <input
                type="email"
                value={form.cliente_email}
                onChange={(e) => setForm({ ...form, cliente_email: e.target.value })}
                placeholder="fernanda@gmail.com"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-sm font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">OBSERVAÇÕES PARA O ATENDIMENTO</label>
              <textarea
                rows="2"
                value={form.observacao}
                onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                placeholder="Ex: Primeira vez no local..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-sm font-bold text-white resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(3)} className="w-1/3 py-3.5 rounded-2xl bg-slate-800 font-bold text-xs">Voltar</button>
              <button
                type="submit"
                disabled={submitting}
                className="w-2/3 py-3.5 rounded-2xl font-black text-xs shadow-xl btn-animated"
                style={{ backgroundColor: primaryColor, color: '#ffffff' }}
              >
                {submitting ? 'Solicitando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: SUCESSO */}
        {step === 5 && (
          <div className="rounded-3xl border border-emerald-500/30 bg-slate-900 p-8 text-center space-y-4 animate-scale-in">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black text-white">Agendamento Solicitado com Sucesso!</h2>
            <p className="text-xs text-slate-400">
              Obrigado, <strong className="text-white">{form.cliente_nome}</strong>! Sua solicitação para <strong style={{ color: accentColor }}>{selectedServico?.nome}</strong> em <strong className="text-white">{selectedDate} às {selectedTime}</strong> foi registrada no sistema.
            </p>

            <button
              onClick={() => { setStep(1); setBookingResult(null); }}
              className="px-6 py-3 rounded-2xl bg-slate-800 text-xs font-black text-white hover:bg-slate-700"
            >
              Fazer Outro Agendamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
