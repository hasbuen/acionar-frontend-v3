import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, Check, Moon, Sun, Layers } from 'lucide-react';
import { ModalAlert, useModalAlert } from '../components/ModalAlert';

export function PublicSchedule({ slug: propSlug }) {
  const slug = propSlug || window.location.pathname.split('/agendar/')[1]?.split('/')[0];
  const [tenant, setTenant] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [subservicos, setSubservicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected State
  const [selectedServico, setSelectedServico] = useState(null);
  const [selectedSubservico, setSelectedSubservico] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);

  // Form State
  const [form, setForm] = useState({
    cliente_nome: '',
    cliente_whatsapp: '',
    observacao: '',
  });

  // Modal Sucesso
  const [showSucessoModal, setShowSucessoModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { alertState, showAlert, closeAlert } = useModalAlert();

  const todayISO = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (slug) {
      fetchTenantPublicData();
    }
  }, [slug]);

  useEffect(() => {
    if (selectedServico) {
      generateTimeSlots();
    }
  }, [selectedServico, selectedDate]);

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

  const handleSelectServico = (s) => {
    setSelectedServico(s);
    setSelectedSubservico(null);
    setSelectedTime('');
    setSubservicos(s.subservicos || []);
  };

  const generateTimeSlots = () => {
    const slots = [
      { time: '08:00', available: true },
      { time: '08:40', available: true },
      { time: '09:20', available: true },
      { time: '10:00', available: true },
      { time: '10:40', available: true },
      { time: '11:20', available: false },
      { time: '13:40', available: true },
      { time: '14:20', available: true },
      { time: '15:00', available: true },
      { time: '15:40', available: true },
      { time: '16:20', available: true },
      { time: '17:00', available: true },
      { time: '17:40', available: true },
      { time: '18:40', available: true },
      { time: '19:20', available: true },
      { time: '20:00', available: true },
      { time: '20:40', available: true },
    ];
    setTimeSlots(slots);
  };

  const handleSubmitAgendamento = async (e) => {
    e.preventDefault();
    if (!selectedServico) {
      showAlert({ type: 'warning', title: 'Serviço não selecionado', message: 'Por favor, selecione um serviço na lista.' });
      return;
    }
    if (!selectedTime) {
      showAlert({ type: 'warning', title: 'Horário não selecionado', message: 'Por favor, escolha um horário disponível.' });
      return;
    }

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

      setShowSucessoModal(true);
    } catch (err) {
      showAlert({ type: 'error', message: err.message || 'Erro ao solicitar agendamento.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center text-xs font-extrabold">
        Carregando agendamento...
      </div>
    );
  }

  if (error || !tenant?.agenda_publica_ativa) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-[2.5rem] bg-slate-900 border border-slate-800 p-8 text-center space-y-4">
          <h2 className="text-xl font-extrabold">Agenda Indisponível</h2>
          <p className="text-xs text-slate-400">{error || 'A agenda pública deste estabelecimento está fechada no momento.'}</p>
        </div>
      </div>
    );
  }

  const primaryColor = tenant.cor_primaria || '#2563eb';
  const bgColor = tenant.cor_fundo || '#020617';

  return (
    <div className="min-h-[100dvh] text-slate-100 flex flex-col justify-between" style={{ backgroundColor: bgColor }}>
      <ModalAlert {...alertState} onClose={closeAlert} />
      {/* Header Principal Idêntico a agendar.html */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#020617]/80 backdrop-blur-xl">
        <div className="px-4 sm:px-6 py-3.5 max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.foto_url ? (
              <img src={tenant.foto_url} alt={tenant.nome_empresa} className="h-10 w-10 rounded-2xl object-cover shadow-md" />
            ) : (
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white font-black text-xl shadow-md">
                {tenant.nome_empresa[0]}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">Agendamento Online</span>
              <h1 className="text-lg font-extrabold tracking-tight text-white">{tenant.nome_empresa}</h1>
            </div>
          </div>

          <div className="h-9 w-9 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Moon className="h-4 w-4" />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal Form */}
      <main className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
        <div className="max-w-xl mx-auto space-y-6">

          {/* Card do Estabelecimento & Endereço */}
          <div className="bg-slate-900/60 p-5 rounded-[2.5rem] shadow-sm border border-slate-800 backdrop-blur-md space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Localização</span>
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Rua da amizade 515 bairro: 14 de novembro
            </p>
          </div>

          {/* Form de Agendamento */}
          <form onSubmit={handleSubmitAgendamento} className="space-y-6">

            {/* PASSO 1: SELEÇÃO DE SERVIÇO */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-[2.5rem] shadow-sm border border-slate-800 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-sm">1</div>
                <h2 className="text-base font-extrabold text-white">Escolha o Serviço</h2>
              </div>

              <div className="space-y-2.5">
                {servicos.map((s) => {
                  const isSelected = selectedServico?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectServico(s)}
                      className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between gap-3 transition-all ${
                        isSelected
                          ? 'border-2 border-blue-600 bg-blue-500/10 shadow-md scale-[1.01]'
                          : 'border-slate-800 bg-slate-800/40 hover:border-blue-500'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-white text-sm truncate">{s.nome}</h4>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{s.duracao_minutos} minutos</span>
                          {s.descricao && <span>• {s.descricao}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-black text-emerald-400 text-sm">R$ {parseFloat(s.preco).toFixed(2)}</span>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white transition-colors ${
                          isSelected ? 'bg-blue-600' : 'border-2 border-slate-600'
                        }`}>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* OPÇÕES DE SUBSERVIÇOS / VARIAÇÕES */}
              {selectedServico && subservicos.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5 mb-2">
                    <Layers className="h-3.5 w-3.5" /> Escolha uma Opção / Variação (Opcional)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {subservicos.map((sub) => {
                      const isSubSelected = selectedSubservico?.id === sub.id;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => setSelectedSubservico(isSubSelected ? null : sub)}
                          className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between gap-3 transition-all ${
                            isSubSelected
                              ? 'border-2 border-blue-600 bg-blue-500/10 scale-[1.01]'
                              : 'border-slate-800 bg-slate-800/40 hover:border-blue-500'
                          }`}
                        >
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">{sub.nome}</h5>
                            {sub.descricao && <p className="text-[10px] text-slate-400 truncate">{sub.descricao}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-xs font-extrabold text-emerald-400">
                              {parseFloat(sub.preco_adicional || 0) > 0 ? `+ R$ ${parseFloat(sub.preco_adicional).toFixed(2)}` : 'Incluso'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* PASSO 2: DATA E HORÁRIO */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-[2.5rem] shadow-sm border border-slate-800 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-sm">2</div>
                <h2 className="text-base font-extrabold text-white">Data & Horário</h2>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Selecione o Dia</label>
                <input
                  type="date"
                  min={todayISO}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  className="w-full rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400">Horários Livres</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1.5 border border-slate-800/80 rounded-2xl bg-slate-950/40">
                  {!selectedServico ? (
                    <div className="col-span-full py-4 text-xs text-slate-400 text-center font-medium">Por favor, selecione um serviço primeiro.</div>
                  ) : (
                    timeSlots.map((slot) => {
                      const isSelected = selectedTime === slot.time;
                      return slot.available ? (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => setSelectedTime(slot.time)}
                          className={`px-3 py-2.5 rounded-xl border text-xs text-center font-extrabold transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-lg shadow-blue-500/25 scale-105'
                              : 'border-slate-800 bg-slate-900 text-slate-100 hover:border-blue-500 hover:bg-slate-800'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ) : (
                        <button
                          key={slot.time}
                          type="button"
                          disabled
                          className="px-3 py-2.5 rounded-xl border border-slate-800/40 bg-slate-900/30 text-slate-600 font-semibold text-xs text-center line-through cursor-not-allowed"
                        >
                          {slot.time}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* PASSO 3: SEUS DADOS */}
            <div className="bg-slate-900/60 p-5 sm:p-6 rounded-[2.5rem] shadow-sm border border-slate-800 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-sm">3</div>
                <h2 className="text-base font-extrabold text-white">Seus Dados de Contato</h2>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1">Seu Nome Completo</label>
                <input
                  type="text"
                  required
                  value={form.cliente_nome}
                  onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })}
                  placeholder="Ex: Maria Oliveira"
                  className="w-full rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1">Seu WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={form.cliente_whatsapp}
                  onChange={(e) => setForm({ ...form, cliente_whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1">Observações (Opcional)</label>
                <textarea
                  rows="2"
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  placeholder="Ex: Primeira vez no espaço..."
                  className="w-full rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Botão de Enviar */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-4 text-base font-extrabold text-white shadow-xl shadow-blue-500/25 transition-transform active:scale-95 btn-animated"
            >
              <CheckCircle className="h-5 w-5" />
              <span>{submitting ? 'Solicitando...' : 'Solicitar Agendamento'}</span>
            </button>
          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-800/60">
        Acionar Agendamentos &copy; 2026 — Todos os direitos reservados.
      </footer>

      {/* MODAL DE SUCESSO */}
      {showSucessoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-md p-6 sm:p-8 shadow-2xl text-center space-y-5 my-auto animate-scale-in">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white">Agendamento Solicitado! 🎉</h3>
              <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                Sua solicitação foi enviada com sucesso! O estabelecimento recebeu seu pedido e enviará a confirmação direta no seu WhatsApp.
              </p>
            </div>
            <button
              onClick={() => { setShowSucessoModal(false); setSelectedServico(null); setSelectedTime(''); }}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition-transform active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
