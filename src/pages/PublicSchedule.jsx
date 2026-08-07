import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, Check, Moon, Sun, Layers, ArrowLeft, ArrowRight, Scissors, Boxes, Home, Building, Sparkles, UserCheck } from 'lucide-react';
import { ModalAlert, useModalAlert } from '../components/ModalAlert';

export function PublicSchedule({ slug: propSlug }) {
  const slug = propSlug || window.location.pathname.split('/agendar/')[1]?.split('/')[0];
  const [tenant, setTenant] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [subservicos, setSubservicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);

  // Selected State
  const [selectedServico, setSelectedServico] = useState(null);
  const [selectedSubservico, setSelectedSubservico] = useState(null);
  const [selectedProfissional, setSelectedProfissional] = useState(null);
  const [tipoAtendimento, setTipoAtendimento] = useState('salao'); // 'salao' | 'domicilio'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);

  // Form State
  const [form, setForm] = useState({
    cliente_nome: '',
    cliente_whatsapp: '',
    observacao: '',
  });

  const [formEndereco, setFormEndereco] = useState({
    rua: '',
    numero: '',
    bairro: '',
    complemento: '',
  });

  // Modal Sucesso
  const [showSucessoModal, setShowSucessoModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { alertState, showAlert, closeAlert } = useModalAlert();

  const todayISO = new Date().toISOString().split('T')[0];

  const temAtendimentoDomicilio = (profissionais || []).some(
    p => p.aceita_atendimento_externo === true || String(p.aceita_atendimento_externo) === 'true'
  );

  const profissionaisElegiveis = React.useMemo(() => {
    if (!profissionais) return [];
    if (tipoAtendimento === 'domicilio') {
      return profissionais.filter(p => p.aceita_atendimento_externo === true || String(p.aceita_atendimento_externo) === 'true');
    }
    return profissionais;
  }, [profissionais, tipoAtendimento]);

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

      try {
        const resP = await fetch(`/api/public/tenant/${slug}/profissionais`);
        const dataP = await resP.json();
        setProfissionais(dataP.profissionais || []);
      } catch (pErr) {
        console.warn('Erro ao carregar profissionais públicos:', pErr);
      }
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
    const now = new Date();
    const currH = now.getHours();
    const currM = now.getMinutes();
    const currentMinutes = currH * 60 + currM;

    const baseSlots = [
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

    const slots = baseSlots.map(slot => {
      const [slotH, slotM] = slot.time.split(':').map(Number);
      const slotMinutes = slotH * 60 + slotM;

      if (selectedDate === todayISO && slotMinutes <= currentMinutes) {
        return { ...slot, available: false };
      }
      return slot;
    });

    setTimeSlots(slots);
  };

  const nextStep = () => {
    if (currentStep === 1 && !selectedServico) {
      showAlert({ type: 'warning', title: 'Atenção', message: 'Selecione um serviço para continuar.' });
      return;
    }
    if (currentStep === 2 && !selectedTime) {
      showAlert({ type: 'warning', title: 'Atenção', message: 'Selecione um horário disponível para continuar.' });
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitAgendamento = async (e) => {
    e.preventDefault();
    if (!selectedServico || !selectedTime) return;
    if (!form.cliente_nome || !form.cliente_whatsapp) {
      showAlert({ type: 'warning', title: 'Dados Incompletos', message: 'Preencha seu nome e WhatsApp.' });
      return;
    }

    if (tipoAtendimento === 'domicilio' && (!formEndereco.rua || !formEndereco.numero || !formEndereco.bairro)) {
      showAlert({ type: 'warning', title: 'Endereço Incompleto', message: 'Por favor, informe a Rua, Número e Bairro para o atendimento a domicílio.' });
      return;
    }

    setSubmitting(true);
    try {
      const dataHoraIso = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      const enderecoFormatado = tipoAtendimento === 'domicilio'
        ? `${formEndereco.rua}, ${formEndereco.numero} - ${formEndereco.bairro}${formEndereco.complemento ? ` (${formEndereco.complemento})` : ''}`
        : null;

      const res = await fetch(`/api/public/tenant/${slug}/agendamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          servico_id: selectedServico.id,
          subservico_id: selectedSubservico?.id || null,
          profissional_id: selectedProfissional?.id || null,
          tipo_atendimento: tipoAtendimento,
          endereco_externo: enderecoFormatado,
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
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-sm font-extrabold">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-b-blue-500 border-r-transparent border-l-transparent animate-spin mb-4"></div>
          Carregando agenda...
        </div>
      </div>
    );
  }

  if (error || !tenant?.agenda_publica_ativa) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-[2.5rem] bg-slate-900 border border-slate-800 p-8 text-center space-y-4 shadow-2xl">
          <h2 className="text-xl font-extrabold text-slate-200">Agenda Indisponível</h2>
          <p className="text-sm text-slate-400">{error || 'A agenda pública deste estabelecimento está fechada no momento.'}</p>
        </div>
      </div>
    );
  }

  const primaryColor = tenant.cor_primaria || '#2563eb';
  const highlightColor = tenant.cor_destaque || '#f59e0b';
  const bgColor = tenant.cor_fundo || '#020617';
  const textPrimary = tenant.cor_texto_principal || '#ffffff';
  const textSecondary = tenant.cor_texto_secundario || '#94a3b8';

  // Helper para lidar com opacidade de HEX
  const hexToRgb = (hex) => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '37, 99, 235';
  };

  const customStyles = {
    '--color-primary': primaryColor,
    '--color-primary-rgb': hexToRgb(primaryColor),
    '--color-highlight': highlightColor,
    '--color-bg': bgColor,
    '--color-text-primary': textPrimary,
    '--color-text-secondary': textSecondary,
  };

  return (
    <div 
      className="min-h-[100dvh] flex flex-col justify-between font-sans transition-colors duration-500" 
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', ...customStyles }}
    >
      <style>{`
        .step-enter { animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .btn-primary {
          background: var(--color-primary);
          box-shadow: 0 10px 25px -5px rgba(var(--color-primary-rgb), 0.4);
        }
        .btn-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .border-active {
          border-color: var(--color-primary) !important;
          background-color: rgba(var(--color-primary-rgb), 0.05) !important;
        }
      `}</style>

      <ModalAlert {...alertState} onClose={closeAlert} />
      
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 backdrop-blur-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <div className="px-5 py-4 max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {tenant.foto_url ? (
              <img src={tenant.foto_url} alt={tenant.nome_empresa} className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10 shadow-lg" />
            ) : (
              <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg ring-2 ring-white/10" style={{ background: 'var(--color-primary)' }}>
                {tenant.nome_empresa[0]}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[0.65rem] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--color-text-secondary)' }}>Agendamento Online</span>
              <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>{tenant.nome_empresa}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* STEP INDICATOR */}
      <div className="w-full max-w-2xl mx-auto px-5 pt-6 pb-2">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full z-0 transition-all duration-500 ease-out" 
            style={{ width: currentStep === 1 ? '15%' : currentStep === 2 ? '50%' : '100%', background: 'var(--color-primary)' }}
          ></div>
          
          {[1, 2, 3].map((step) => (
            <div key={step} className={`relative z-10 flex flex-col items-center gap-2 transition-all duration-300 ${currentStep >= step ? 'opacity-100' : 'opacity-40'}`}>
              <div 
                className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-sm shadow-md transition-colors ${currentStep >= step ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={{ background: currentStep >= step ? 'var(--color-primary)' : '' }}
              >
                {currentStep > step ? <Check className="h-4 w-4" /> : step}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                {step === 1 ? 'Serviço' : step === 2 ? 'Horário' : 'Confirmação'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 w-full max-w-2xl mx-auto py-6 px-4 sm:px-6 flex flex-col">
        
        {/* WIZARD CONTAINER */}
        <div className="flex-1 relative">
          
          {/* PASSO 1 */}
          {currentStep === 1 && (
            <div className="step-enter space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl sm:text-2xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>O que você deseja fazer?</h2>
                <p className="text-xs sm:text-sm opacity-80 mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Selecione o serviço ideal para você.</p>
              </div>

              {/* SELETOR DE LOCAL DE ATENDIMENTO (APENAS SE HOUVER ATENDIMENTO A DOMICÍLIO CADASTRADO) */}
              {temAtendimentoDomicilio && (
                <div className="flex items-center justify-center p-1 rounded-2xl bg-white/5 border border-white/10 max-w-md mx-auto mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoAtendimento('salao');
                      setSelectedProfissional(null);
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                      tipoAtendimento === 'salao'
                        ? 'bg-white text-slate-900 shadow-md font-black scale-[1.02]'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Building className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>No Estabelecimento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTipoAtendimento('domicilio');
                      const domProfs = (profissionais || []).filter(p => p.aceita_atendimento_externo === true || String(p.aceita_atendimento_externo) === 'true');
                      if (domProfs.length === 1) {
                        setSelectedProfissional(domProfs[0]);
                      } else {
                        setSelectedProfissional(null);
                      }
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                      tipoAtendimento === 'domicilio'
                        ? 'bg-emerald-500 text-white shadow-md font-black scale-[1.02]'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Home className="h-4 w-4 text-amber-300 shrink-0" />
                    <span>Atendimento Domicílio</span>
                  </button>
                </div>
              )}

              {/* SELETOR DE PROFISSIONAL (SOMENTE EXIBE ELEGÍVEIS PARA O LOCAL SELECIONADO) */}
              {profissionaisElegiveis.length > 1 && (
                <div className="mb-4 space-y-2">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-white/50 text-center">
                    Profissional de Preferência (Opcional):
                  </span>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedProfissional(null)}
                      className={`px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all border ${
                        !selectedProfissional
                          ? 'bg-white/20 border-white text-white shadow-sm'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>Qualquer um</span>
                    </button>
                    {profissionaisElegiveis.map((p) => {
                      const isSel = selectedProfissional?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedProfissional(p)}
                          className={`px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-2 transition-all border ${
                            isSel
                              ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                              : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                          }`}
                        >
                          {p.foto_url ? (
                            <img src={p.foto_url} alt={p.nome} className="h-4 w-4 rounded-full object-cover shrink-0" />
                          ) : (
                            <span className="h-4 w-4 rounded-full bg-white/20 text-[9px] flex items-center justify-center font-bold">
                              {p.nome[0]}
                            </span>
                          )}
                          <span>{p.nome}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid gap-3">
                {servicos.map((s) => {
                  const isSelected = selectedServico?.id === s.id;
                  const hasSubservices = s.subservicos && s.subservicos.length > 0;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectServico(s)}
                      className={`p-4 rounded-3xl border border-white/5 cursor-pointer flex flex-col gap-2 transition-all duration-300 bg-white/5 hover:bg-white/10 ${
                        isSelected ? 'border-active scale-[1.01]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 w-full">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="h-14 w-14 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-white/5 flex items-center justify-center shadow-md">
                            {s.foto_url ? (
                              <img 
                                src={s.foto_url} 
                                alt={s.nome} 
                                className="h-full w-full object-cover" 
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <Scissors className="h-6 w-6 opacity-40" style={{ color: 'var(--color-text-secondary)' }} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-base truncate" style={{ color: 'var(--color-text-primary)' }}>{s.nome}</h4>
                            <p className="text-xs opacity-90 flex items-center gap-2 mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                              <span>{s.duracao_minutos} min</span>
                              {s.descricao && <span className="truncate">• {s.descricao}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="font-black text-sm" style={{ color: 'var(--color-highlight)' }}>
                            R$ {parseFloat(s.preco).toFixed(2)}
                          </span>
                          <div 
                            className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors border-2 ${isSelected ? 'border-transparent text-white' : 'border-white/20'}`}
                            style={{ background: isSelected ? 'var(--color-primary)' : 'transparent' }}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      </div>

                      {/* Efeito Acordeão Expansível de Subserviços */}
                      {hasSubservices && (
                        <div 
                          className={`overflow-hidden transition-all duration-500 ease-in-out ${
                            isSelected ? 'max-h-[600px] opacity-100 mt-4 pt-4 border-t border-white/5' : 'max-h-0 opacity-0 pointer-events-none'
                          }`}
                        >
                          <h5 className="text-[10px] font-black uppercase tracking-wider mb-3 text-slate-400 flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-blue-400" /> Selecione uma Variação (Opcional):
                          </h5>
                          <div className="grid grid-cols-1 gap-2.5">
                            {s.subservicos.map((sub) => {
                              const isSubSelected = selectedSubservico?.id === sub.id;
                              return (
                                <div
                                  key={sub.id}
                                  onClick={(e) => {
                                    e.stopPropagation(); // Evita recarregar/resetar a seleção do serviço pai
                                    setSelectedSubservico(isSubSelected ? null : sub);
                                  }}
                                  className={`p-3.5 rounded-2xl border border-white/5 cursor-pointer flex items-center justify-between gap-3 transition-all bg-white/5 hover:bg-white/10 ${
                                    isSubSelected ? 'border-active bg-white/10' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="h-9 w-9 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white/5 flex items-center justify-center shadow-sm">
                                      {sub.foto_url ? (
                                        <img 
                                          src={sub.foto_url} 
                                          alt={sub.nome} 
                                          className="h-full w-full object-cover" 
                                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                      ) : (
                                        <Boxes className="h-4 w-4 opacity-40" style={{ color: 'var(--color-text-secondary)' }} />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h6 className="text-sm font-extrabold truncate" style={{ color: 'var(--color-text-primary)' }}>{sub.nome}</h6>
                                      {sub.duracao_adicional_minutos && parseInt(sub.duracao_adicional_minutos, 10) > 0 && (
                                        <p className="text-[10px] opacity-80 mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                          +{sub.duracao_adicional_minutos} minutos adicionais
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 flex items-center gap-3">
                                    <span className="block text-xs font-black" style={{ color: 'var(--color-highlight)' }}>
                                      {parseFloat(sub.preco_adicional || 0) > 0 ? `+ R$ ${parseFloat(sub.preco_adicional).toFixed(2)}` : 'Incluso'}
                                    </span>
                                    <div 
                                      className={`h-4.5 w-4.5 rounded-full flex items-center justify-center transition-colors border ${isSubSelected ? 'border-transparent text-white' : 'border-white/20'}`}
                                      style={{ background: isSubSelected ? 'var(--color-primary)' : 'transparent' }}
                                    >
                                      {isSubSelected && <Check className="h-2.5 w-2.5" />}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASSO 2 */}
          {currentStep === 2 && (
            <div className="step-enter space-y-6">
               <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>Quando será?</h2>
                <p className="text-sm opacity-80 mt-1" style={{ color: 'var(--color-text-secondary)' }}>Escolha a melhor data e horário.</p>
              </div>

              <div className="bg-white/5 p-5 rounded-3xl border border-white/5 space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest opacity-80 mb-2" style={{ color: 'var(--color-text-secondary)' }}>Selecione o Dia</label>
                  <input
                    type="date"
                    min={todayISO}
                    value={selectedDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      if (newDate < todayISO) {
                        setSelectedDate(todayISO);
                        setSelectedTime('');
                      } else {
                        setSelectedDate(newDate);
                        setSelectedTime('');
                      }
                    }}
                    required
                    className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3.5 text-base text-white focus:outline-none focus:border-white/30 transition-colors font-medium shadow-inner color-scheme-dark"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest opacity-80 mb-2" style={{ color: 'var(--color-text-secondary)' }}>Horários Livres</label>
                  
                  {timeSlots.every(slot => !slot.available) ? (
                    <div className="p-4 border border-white/5 rounded-2xl bg-black/20 text-center space-y-2 shadow-inner">
                      <div className="h-10 w-10 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-2">
                        <Moon className="h-5 w-5 opacity-50" style={{ color: 'var(--color-text-secondary)' }} />
                      </div>
                      <p className="text-sm font-extrabold" style={{ color: 'var(--color-text-primary)' }}>Expediente Encerrado</p>
                      <p className="text-xs opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                        Não há mais horários disponíveis para esta data. Por favor, selecione o próximo dia útil.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-2 border border-white/5 rounded-2xl bg-black/20 shadow-inner">
                      {timeSlots.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return slot.available ? (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => setSelectedTime(slot.time)}
                            className={`px-2 py-3 rounded-xl text-sm text-center font-extrabold transition-all border ${
                              isSelected
                                ? 'border-transparent scale-105 text-white'
                                : 'border-white/10 hover:bg-white/10'
                            }`}
                            style={{ 
                              background: isSelected ? 'var(--color-primary)' : 'transparent', 
                              boxShadow: isSelected ? '0 8px 20px -5px rgba(var(--color-primary-rgb), 0.5)' : 'none',
                              color: isSelected ? '#ffffff' : 'var(--color-text-primary)'
                            }}
                          >
                            {slot.time}
                          </button>
                        ) : (
                          <button
                            key={slot.time}
                            type="button"
                            disabled
                            className="px-2 py-3 rounded-xl border border-white/5 bg-white/5 text-white/30 font-semibold text-sm text-center line-through cursor-not-allowed"
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PASSO 3 */}
          {currentStep === 3 && (
            <div className="step-enter space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>Quase lá!</h2>
                <p className="text-sm opacity-80 mt-1" style={{ color: 'var(--color-text-secondary)' }}>Preencha seus dados para finalizar.</p>
              </div>

              <form id="agendamento-form" onSubmit={handleSubmitAgendamento} className="bg-white/5 p-5 sm:p-6 rounded-3xl border border-white/5 space-y-4 shadow-lg">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest opacity-80 mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Seu Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={form.cliente_nome}
                    onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })}
                    placeholder="Ex: Maria Oliveira"
                    style={{ color: 'var(--color-text-primary)' }}
                    className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3.5 text-base placeholder:opacity-50 focus:outline-none focus:border-white/30 transition-colors font-medium shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest opacity-80 mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Seu WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={form.cliente_whatsapp}
                    onChange={(e) => setForm({ ...form, cliente_whatsapp: e.target.value })}
                    placeholder="(11) 99999-9999"
                    style={{ color: 'var(--color-text-primary)' }}
                    className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3.5 text-base placeholder:opacity-50 focus:outline-none focus:border-white/30 transition-colors font-medium shadow-inner"
                  />
                </div>

                {/* ENDEREÇO DE ATENDIMENTO DOMICILIAR */}
                {tipoAtendimento === 'domicilio' && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Home className="h-4 w-4 shrink-0" />
                      <h4 className="text-xs font-black uppercase tracking-wider">Endereço para Atendimento Domiciliar</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1" style={{ color: 'var(--color-text-secondary)' }}>Rua / Logradouro *</label>
                        <input
                          type="text"
                          required={tipoAtendimento === 'domicilio'}
                          value={formEndereco.rua}
                          onChange={(e) => setFormEndereco({ ...formEndereco, rua: e.target.value })}
                          placeholder="Ex: Av. Paulista"
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1" style={{ color: 'var(--color-text-secondary)' }}>Número *</label>
                        <input
                          type="text"
                          required={tipoAtendimento === 'domicilio'}
                          value={formEndereco.numero}
                          onChange={(e) => setFormEndereco({ ...formEndereco, numero: e.target.value })}
                          placeholder="Ex: 1000"
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1" style={{ color: 'var(--color-text-secondary)' }}>Bairro *</label>
                        <input
                          type="text"
                          required={tipoAtendimento === 'domicilio'}
                          value={formEndereco.bairro}
                          onChange={(e) => setFormEndereco({ ...formEndereco, bairro: e.target.value })}
                          placeholder="Ex: Bela Vista"
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1" style={{ color: 'var(--color-text-secondary)' }}>Complemento / Referência</label>
                        <input
                          type="text"
                          value={formEndereco.complemento}
                          onChange={(e) => setFormEndereco({ ...formEndereco, complemento: e.target.value })}
                          placeholder="Ex: Apto 42, Bloco B"
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest opacity-80 mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Observações (Opcional)</label>
                  <textarea
                    rows="2"
                    value={form.observacao}
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                    placeholder="Ex: Primeira vez no espaço..."
                    style={{ color: 'var(--color-text-primary)' }}
                    className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3 text-base placeholder:opacity-50 focus:outline-none focus:border-white/30 transition-colors font-medium shadow-inner resize-none"
                  />
                </div>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* FOOTER ACTIONS (WIZARD NAV) */}
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-4 border-t border-white/5 bg-black/10 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          {currentStep > 1 ? (
             <button
              onClick={prevStep}
              className="px-5 py-4 rounded-2xl border border-white/10 text-white font-bold flex items-center gap-2 hover:bg-white/5 transition-colors active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          ) : (
            <div></div> // Espaçador
          )}

          {currentStep < 3 ? (
             <button
              onClick={nextStep}
              className="flex-1 sm:flex-none px-8 py-4 rounded-2xl text-white font-extrabold flex items-center justify-center gap-2 transition-transform active:scale-95 btn-primary"
            >
              <span>Avançar</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="submit"
              form="agendamento-form"
              disabled={submitting}
              className="flex-1 px-8 py-4 rounded-2xl text-white font-extrabold flex items-center justify-center gap-2 transition-transform active:scale-95 btn-primary"
            >
              <CheckCircle className="h-5 w-5" />
              <span>{submitting ? 'Enviando...' : 'Confirmar Agendamento'}</span>
            </button>
          )}
        </div>
      </div>

      {/* MODAL DE SUCESSO */}
      {showSucessoModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" style={{ animation: 'fadeUp 0.3s ease-out' }}>
          <div 
            className="border border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl text-center space-y-6 relative overflow-hidden"
            style={{ background: 'var(--color-bg)' }}
          >
            <div className="absolute top-0 left-0 w-full h-2" style={{ background: 'var(--color-primary)' }}></div>
            <div 
              className="h-20 w-20 rounded-full flex items-center justify-center mx-auto shadow-2xl"
              style={{ background: 'rgba(var(--color-primary-rgb), 0.1)', color: 'var(--color-primary)' }}
            >
              <Check className="h-10 w-10" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black" style={{ color: 'var(--color-text-primary)' }}>Prontinho! 🎉</h3>
              <p className="text-sm opacity-80 font-medium leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Sua solicitação foi enviada. O estabelecimento analisará seu pedido e você receberá o retorno no WhatsApp.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 rounded-2xl text-white font-extrabold text-sm transition-transform active:scale-95 btn-primary mt-2"
            >
              Fazer novo agendamento
            </button>
          </div>
        </div>
      )}

      {/* Força color-scheme no input date */}
      <style>{`
        .color-scheme-dark { color-scheme: dark; }
      `}</style>
    </div>
  );
}
