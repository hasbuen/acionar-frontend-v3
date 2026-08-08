import React, { useEffect, useMemo, useState, useRef } from 'react';
import Chart from 'react-apexcharts';
import { apiRequest } from '../services/api';
import { gsap } from 'gsap';
import { PaymentModal } from '../components/PaymentModal';
import { PremiumSelect } from '../components/PremiumSelect';
import { useAuth } from '../context/AuthContext';
import { NewAppointmentModal } from '../components/NewAppointmentModal';
import { ModalAlert, useModalAlert } from '../components/ModalAlert';
import { MapModal } from '../components/MapModal';
import {
  Activity, AlertCircle, ArrowRightLeft, Banknote, Calendar, CalendarDays, Check, CheckCircle, ChevronDown, ChevronUp, Clock, CreditCard, DollarSign,
  Edit3, Home, Info, Link, Map, MapPin, Maximize2, Minimize2, MessageSquare, Phone, Plus, QrCode, Scissors, ShieldCheck, Trash2, User,
  WalletCards, Wrench, X, Zap
} from 'lucide-react';

// Extrai a observação legível do campo que pode conter JSON interno com dados temporários do cliente
function getDisplayObservacao(obs) {
  if (!obs) return '';
  if (typeof obs === 'string' && obs.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(obs);
      if (parsed && parsed.temp_cliente_nome !== undefined) return parsed.observacao_cliente || '';
    } catch (e) {}
  }
  if (typeof obs === 'object' && obs !== null && obs.temp_cliente_nome !== undefined) {
    return obs.observacao_cliente || '';
  }
  return obs;
}

const filters = [
  ['todos', 'Todos'], ['hoje', 'Hoje'], ['solicitacoes', 'Solicitações'],
  ['agendado', 'Confirmados'], ['em_atendimento', 'Em Atendimento'],
  ['concluido', 'Atendidos'], ['manutencao', 'Manutenções'], ['cancelado', 'Cancelados']
];

const statusLabels = {
  aguardando_confirmacao: 'AGUARDANDO CONFIRMAÇÃO',
  solicitado: 'AGUARDANDO CONFIRMAÇÃO',
  agendado: 'CONFIRMADO',
  confirmado: 'CONFIRMADO',
  em_atendimento: 'EM ATENDIMENTO',
  concluido: 'JÁ ATENDIDO',
  atendido: 'JÁ ATENDIDO',
  manutencao: 'MANUTENÇÃO',
  cancelado: 'CANCELADO',
  recusado: 'RECUSADO'
};

const statusClasses = {
  aguardando_confirmacao: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  solicitado: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  agendado: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  confirmado: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  em_atendimento: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  concluido: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  atendido: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  manutencao: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  cancelado: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  recusado: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
};

const buttonStyles = {
  notes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 glow-amber',
  whatsapp: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 glow-green',
  maintenance: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20 glow-purple',
  payment: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 hover:bg-teal-500/20 glow-blue',
  transfer: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 glow-blue',
  edit: 'bg-slate-500/10 text-slate-700 dark:text-slate-200 border-slate-500/20 hover:bg-slate-500/20 glow-blue',
  delete: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20 glow-rose'
};

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-blue-500';

function formatDate(value) {
  return new Date(value).toLocaleDateString('pt-BR');
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function dateParts(value) {
  const date = new Date(value);
  return { month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), day: date.getDate() };
}

function getGoogleMapsUrl(endereco) {
  if (!endereco) return '#';
  let query = '';
  if (typeof endereco === 'object') {
    query = `${endereco.rua || ''}, ${endereco.numero || ''} ${endereco.bairro ? `- ${endereco.bairro}` : ''}`;
  } else {
    try {
      const parsed = JSON.parse(endereco);
      if (typeof parsed === 'object' && parsed !== null) {
        query = `${parsed.rua || ''}, ${parsed.numero || ''} ${parsed.bairro ? `- ${parsed.bairro}` : ''}`;
      } else {
        query = String(endereco);
      }
    } catch (e) {
      query = String(endereco);
    }
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}

function formatEnderecoTexto(endereco) {
  if (!endereco) return 'Endereço informado no agendamento';
  if (typeof endereco === 'object') {
    return `${endereco.rua || ''}, ${endereco.numero || ''} ${endereco.bairro ? `— ${endereco.bairro}` : ''} ${endereco.complemento ? `(${endereco.complemento})` : ''}`;
  }
  try {
    const parsed = JSON.parse(endereco);
    if (typeof parsed === 'object' && parsed !== null) {
      return `${parsed.rua || ''}, ${parsed.numero || ''} ${parsed.bairro ? `— ${parsed.bairro}` : ''} ${parsed.complemento ? `(${parsed.complemento})` : ''}`;
    }
  } catch (e) {}
  return String(endereco);
}

function Modal({ title, subtitle, children, onClose, wide = false }) {
  const modalRef = React.useRef(null);
  const overlayRef = React.useRef(null);

  React.useEffect(() => {
    gsap.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: 'power2.out' }
    );
    gsap.fromTo(modalRef.current,
      { scale: 0.92, opacity: 0, y: 15 },
      { scale: 1, opacity: 1, y: 0, x: 0, duration: 0.4, ease: 'back.out(1.4)', delay: 0.05 }
    );
  }, []);

  const handleClose = () => {
    gsap.to(modalRef.current, {
      scale: 0.94, opacity: 0, y: 10, duration: 0.2, ease: 'power2.in',
      onComplete: onClose
    });
    gsap.to(overlayRef.current, {
      opacity: 0, duration: 0.2, ease: 'power2.in'
    });
  };

  return (
    <div 
      ref={overlayRef} 
      className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center bg-slate-950/40 p-0 sm:p-4 backdrop-blur-md"
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, transform: 'none' }}
    >
      <div ref={modalRef} className={`relative w-full ${wide ? 'max-w-xl' : 'max-w-md'} overflow-hidden rounded-t-[2.2rem] sm:rounded-[2.2rem] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 sm:p-6 max-h-[88dvh] overflow-y-auto scroll-y-touch pb-safe-bottom`}>
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <header className="mb-5">
          <h2 className="text-xl font-black text-slate-950 dark:text-white leading-tight">{title}</h2>
          {subtitle && <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </header>
        {children}
      </div>
    </div>
  );
}

function ActionButton({ kind, label, children, onClick }) {
  return <button type="button" onClick={onClick} title={label} aria-label={label} className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${buttonStyles[kind]}`}>{children}</button>;
}

function DetailsModal({ item, onClose, onUpdateStatus, onOpenMaintenance, onEditFull, onOpenMap }) {
  const [selectedStatus, setSelectedStatus] = useState(item.status || 'agendado');
  const [saving, setSaving] = useState(false);

  const statusOptions = [
    { value: 'agendado', label: 'Confirmado', badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
    { value: 'em_atendimento', label: 'Em Atendimento', badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' },
    { value: 'concluido', label: 'Já Atendido / Concluído', badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
    { value: 'manutencao', label: 'Manutenção Periódica', badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' },
    { value: 'cancelado', label: 'Cancelado / Recusado', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' }
  ];

  const currentOption = statusOptions.find(o => o.value === selectedStatus) || statusOptions[0];

  const handleSave = async () => {
    if (selectedStatus === 'manutencao') {
      onClose();
      onOpenMaintenance(item);
      return;
    }

    setSaving(true);
    try {
      await onUpdateStatus(item, { status: selectedStatus }, `Status alterado para ${currentOption.label}.`);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Detalhes"
      subtitle={`${item.servico_nome || 'Serviço'} • ${formatDate(item.data_hora)} às ${formatTime(item.data_hora)}`}
      onClose={onClose}
    >
      <div className="space-y-3.5 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Cliente</span>
          <strong className="text-slate-900 dark:text-white font-bold">{item.cliente_nome || 'Cliente'}</strong>
        </div>
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Serviço</span>
          <strong className="text-slate-900 dark:text-white font-bold">{item.servico_nome || 'Atendimento'}</strong>
        </div>
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Data e horário</span>
          <strong className="text-slate-900 dark:text-white font-bold">{formatDate(item.data_hora)} às {formatTime(item.data_hora)}</strong>
        </div>
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Valor total</span>
          <strong className="text-emerald-600 dark:text-emerald-400 font-black text-base">R$ {Number(item.valor_total || 0).toFixed(2)}</strong>
        </div>
        
        {getDisplayObservacao(item.observacao) && (
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/50 p-3.5 italic text-slate-700 dark:text-slate-300 text-xs">
            “{getDisplayObservacao(item.observacao)}”
          </div>
        )}

        {/* ENDEREÇO DE ATENDIMENTO DOMICILIAR E BOTAO GOOGLE MAPS */}
        {(item.tipo_atendimento === 'domicilio' || item.tipo_atendimento === 'externo' || item.endereco_externo) && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                <Home className="h-4 w-4 shrink-0" />
                <span>Atendimento Domiciliar</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => onOpenMap(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md transition-all"
                >
                  <Map className="h-3.5 w-3.5" />
                  <span>Ver no mapa</span>
                </button>
                <a
                  href={getGoogleMapsUrl(item.endereco_externo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all shrink-0"
                >
                  <MapPin className="h-3.5 w-3.5 text-white" />
                  <span>Google Maps</span>
                </a>
              </div>
            </div>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
              📍 {formatEnderecoTexto(item.endereco_externo)}
            </p>
          </div>
        )}
      </div>

      {/* Seção de Seleção de Status & Botão Salvar */}
      <div className="mt-6 space-y-2.5">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Status do Agendamento
        </label>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <PremiumSelect
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`font-extrabold ${currentOption.badgeClass}`}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </PremiumSelect>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-animated flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-3.5 text-xs font-black text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 shrink-0"
          >
            {saving ? (
              'Salvando...'
            ) : (
              <>
                <Check className="h-4 w-4 stroke-[3px]" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/50 flex justify-center">
        <button
          type="button"
          onClick={() => onEditFull(item)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <Edit3 className="h-3.5 w-3.5" /> Editar horário ou valor completo
        </button>
      </div>
    </Modal>
  );
}

function NotesModal({ item, onClose, onSave }) {
  const [text, setText] = useState(() => getDisplayObservacao(item.observacao));
  const [saving, setSaving] = useState(false);
  const [newBadgeText, setNewBadgeText] = useState('');

  const DEFAULT_BADGES = [
    "Preferência de horário",
    "Pele sensível / Alergia",
    "Atraso informado",
    "Atendimento concluído",
    "Manutenção recomendada"
  ];

  const [badges, setBadges] = useState(() => {
    const saved = localStorage.getItem('acionar_custom_note_badges');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { }
    }
    return DEFAULT_BADGES;
  });

  const addQuickTag = (tag) => {
    setText(prev => {
      if (!prev.trim()) return tag;
      if (prev.includes(tag)) return prev;
      return `${prev}\n• ${tag}`;
    });
  };

  const handleAddBadge = (e) => {
    e.preventDefault();
    const trimmed = newBadgeText.trim();
    if (!trimmed) return;
    if (!badges.includes(trimmed)) {
      const updated = [...badges, trimmed];
      setBadges(updated);
      localStorage.setItem('acionar_custom_note_badges', JSON.stringify(updated));
    }
    setNewBadgeText('');
  };

  const handleDeleteBadge = (e, badgeToDelete) => {
    e.stopPropagation();
    const updated = badges.filter(b => b !== badgeToDelete);
    setBadges(updated);
    localStorage.setItem('acionar_custom_note_badges', JSON.stringify(updated));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(item, { observacao: text.slice(0, 1000) }, 'Observação salva.');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Observações do Atendimento"
      subtitle={`${item.cliente_nome || 'Cliente'}${item.servico_nome ? ` • ${item.servico_nome}` : ''}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            Anotações Rápidas Personalizadas
          </span>

          <div className="flex gap-2 mb-2.5">
            <input
              type="text"
              value={newBadgeText}
              onChange={(e) => setNewBadgeText(e.target.value)}
              placeholder="Criar novo atalho de anotação..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={handleAddBadge}
              className="btn-animated rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-black text-white shrink-0 shadow-sm"
            >
              + Adicionar
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
            {badges.map((tag, idx) => (
              <div
                key={idx}
                onClick={() => addQuickTag(tag)}
                className="group flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 cursor-pointer transition-all"
              >
                <span>+ {tag}</span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteBadge(e, tag)}
                  title="Excluir este atalho"
                  className="rounded-full p-0.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {badges.length === 0 && (
              <p className="text-[11px] font-medium text-slate-400 italic">Nenhum atalho criado ainda.</p>
            )}
          </div>
        </div>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            rows={5}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-blue-500 placeholder:font-semibold placeholder:text-slate-400"
            placeholder="Registre aqui observações detalhadas sobre este atendimento..."
          />
          <div className="absolute right-3.5 bottom-3.5 text-[10px] font-extrabold text-slate-400">
            {text.length}/1000
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            className="btn-animated rounded-2xl px-5 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-animated flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-3 text-xs font-black text-white shadow-lg shadow-blue-500/25 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : (
              <>
                <Check className="h-4 w-4 stroke-[3px]" />
                Salvar observação
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function OnlinePaymentModal({ item, valor, onClose, notify }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);

  const valorFinal = Number(valor || item.valor_total || 0).toFixed(2);

  useEffect(() => {
    let isMounted = true;
    apiRequest(`/agendamentos/${item.id}/payment`, 'GET')
      .then(data => {
        if (isMounted) {
          setPaymentData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          notify('Erro ao gerar cobrança: ' + (err.message || ''));
          onClose();
        }
      });
    return () => { isMounted = false; };
  }, [item.id, onClose, notify]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    notify(`${label} copiado com sucesso!`);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !paymentData) {
    return (
      <Modal title="Gerando cobrança..." subtitle="Aguarde um instante" onClose={onClose}>
        <div className="flex h-40 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      </Modal>
    );
  }

  const { pixKey, paymentLink } = paymentData;

  const whatsappMessage = paymentLink
    ? `Olá ${item.cliente_nome || ''}! Segue o link seguro para pagamento do seu atendimento (${item.servico_nome || 'Atendimento'}) no valor de R$ ${valorFinal}:\n\n${paymentLink}\n\nVocê pode escolher pagar via Pix ou Cartão.`
    : `Olá ${item.cliente_nome || ''}! Segue a chave Pix Copia e Cola para pagamento do seu atendimento (${item.servico_nome || 'Atendimento'}) no valor de R$ ${valorFinal}:\n\n${pixKey}`;

  return (
    <Modal
      title="Cobrança Pix ou Cartão"
      subtitle={`${item.cliente_nome || 'Cliente'} • R$ ${valorFinal}`}
      onClose={onClose}
    >
      <div className="space-y-4 text-center">
        <div className="mx-auto flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70 shadow-inner">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
            <QrCode className="h-6 w-6" />
          </div>
          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            QR Code Pix para Pagamento
          </span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
            Escaneie com o app do banco ou copie a chave
          </span>

          <div className="rounded-2xl border-4 border-white bg-white p-3 shadow-md">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(pixKey)}`}
              alt="QR Code Pix"
              className="h-36 w-36 object-contain"
            />
          </div>

          <span className="mt-3 text-lg font-black text-emerald-600 dark:text-emerald-400">
            R$ {valorFinal}
          </span>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => copyToClipboard(pixKey, 'Chave Pix')}
            className="btn-animated flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 py-3.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 shadow-sm"
          >
            <QrCode className="h-4 w-4 text-emerald-500" />
            {copied ? 'Chave Pix Copiada!' : 'Copiar Chave Pix (Copia e Cola)'}
          </button>

          {paymentLink && (
            <button
              type="button"
              onClick={() => copyToClipboard(paymentLink, 'Link de Pagamento')}
              className="btn-animated flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 dark:border-blue-900/50 dark:bg-blue-950/30 py-3.5 text-xs font-extrabold text-blue-600 dark:text-blue-400"
            >
              <Link className="h-4 w-4 text-blue-500" />
              Copiar Link Checkout (Pix / Cartão)
            </button>
          )}

          {item.cliente_whatsapp && (
            <a
              href={`https://wa.me/55${item.cliente_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="btn-animated flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20"
            >
              <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              Enviar Cobrança no WhatsApp
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function Agenda() {
  const { user, tenant, socket } = useAuth();
  const { alertState, showAlert, closeAlert } = useModalAlert();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('hoje');
  const [modal, setModal] = useState(null);
  const [nestedModal, setNestedModal] = useState(null);
  const [mapModal, setMapModal] = useState(null); // { item } when open
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentDraft, setPaymentDraft] = useState({ gross: '', discount: '', date: '', method: 'pix', status: 'pago', notes: '' });
  const [toast, setToast] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [form, setForm] = useState({ cliente_id: '', cliente_nome: '', cliente_whatsapp: '', servico_id: '', data_hora: `${new Date().toISOString().slice(0, 10)}T18:40`, observacao: '' });
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);
  
  const [statsOpen, setStatsOpen] = useState(false);
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [msgConfig, setMsgConfig] = useState(null);
  
  const [statViewMode, setStatViewMode] = useState('valores');
  const [statChartType, setStatChartType] = useState('bar');



  useEffect(() => {
    apiRequest('/config/messages')
      .then(res => {
        if (res.settings) setMsgConfig(res.settings);
      })
      .catch(() => {});
  }, []);

  const getWhatsAppMessage = (item) => {
    const isManut = item.status === 'manutencao';
    const address = msgConfig?.endereco || 'Rua da amizade 515 bairro: 14 de novembro';

    let template = '';
    if (isManut) {
      template = msgConfig?.template_manutencao || `Olá, *{cliente}*! 👋\n\nPassando para lembrar que sua *MANUTENÇÃO PERIÓDICA* de *{servico}* está agendada para o dia *{data}* às *{hora}*.\n\n📍 *Endereço*: {endereco}`;
    } else {
      template = msgConfig?.template_confirmacao || `📍 *Endereço*: {endereco}\n\nPor gentileza, informe se concorda com este horário ou se prefere realizar alguma alteração.\n\n📌 *Lembrete importante*: Pedimos a gentileza de chegar com **15 minutos de antecedência**.\n\nAgradecemos a preferência e aguardamos você!😊`;
    }

    return template
      .replace(/{cliente}/g, item.cliente_nome || '')
      .replace(/{servico}/g, item.servico_nome || '')
      .replace(/{data}/g, formatDate(item.data_hora))
      .replace(/{hora}/g, formatTime(item.data_hora))
      .replace(/{endereco}/g, address);
  };

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3000); };

  // Animação em cascata (stagger) dos cards de agendamento usando GSAP
  useEffect(() => {
    if (!loading && agendamentos.length > 0) {
      gsap.fromTo('.appointment-card',
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.05, ease: 'power2.out', overwrite: 'auto' }
      );
    }
  }, [loading, activeFilter, agendamentos]);

  // Animação de pulsação nos contadores estatísticos quando o Accordion abre
  useEffect(() => {
    if (statsOpen) {
      gsap.fromTo('.stat-card',
        { opacity: 0, scale: 0.92, y: -8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'back.out(1.4)', overwrite: 'auto' }
      );
    }
  }, [statsOpen]);

  async function fetchTodosAgendamentos() {
    try {
      const result = await apiRequest('/agendamentos');
      setTodosAgendamentos(result.agendamentos || []);
    } catch (err) {
      console.error('Erro ao buscar todos agendamentos para os contadores:', err);
    }
  }

  const stats = useMemo(() => {
    let solicitados = 0;
    let confirmados = 0;
    let concluidos = 0;
    let cancelados = 0;

    todosAgendamentos.forEach(item => {
      const status = item.status?.toLowerCase();
      if (status === 'aguardando_confirmacao' || status === 'solicitado') {
        solicitados++;
      } else if (status === 'agendado' || status === 'confirmado' || status === 'em_atendimento') {
        confirmados++;
      } else if (status === 'concluido' || status === 'atendido') {
        concluidos++;
      } else if (status === 'cancelado' || status === 'recusado') {
        cancelados++;
      }
    });

    return { solicitados, confirmados, concluidos, cancelados };
  }, [todosAgendamentos]);
  
  const chartOptions = {
    chart: { fontFamily: 'inherit', toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent' },
    colors: ['#d97706', '#2563eb', '#10b981', '#e11d48'],
    plotOptions: { bar: { borderRadius: 6, distributed: true, columnWidth: '45%' } },
    dataLabels: { enabled: statChartType === 'bar', style: { colors: ['#fff'], fontSize: '12px', fontWeight: 'bold' }, offsetY: -20 },
    xaxis: { categories: ['Solicitados', 'Confirmados', 'Atendidos', 'Cancelados'], labels: { style: { colors: '#64748b', fontWeight: 600 } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: '#64748b', fontWeight: 600 } } },
    grid: { borderColor: 'rgba(148, 163, 184, 0.1)', strokeDashArray: 4 },
    stroke: { curve: 'smooth', width: statChartType === 'bar' ? 0 : 3 },
    fill: { type: statChartType === 'area' ? 'gradient' : 'solid', opacity: statChartType === 'area' ? 0.4 : 1, gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.1, stops: [0, 90, 100] } },
    legend: { show: false },
    tooltip: { theme: 'dark' }
  };

  const chartSeries = [{
    name: 'Agendamentos',
    data: [stats.solicitados, stats.confirmados, stats.concluidos, stats.cancelados]
  }];

  async function fetchAgenda(silent = false) {
    if (!silent) setLoading(true);
    try {
      let query = '';
      if (activeFilter === 'hoje') {
        const today = new Date().toISOString().slice(0, 10);
        query = `?data_inicio=${today}T00:00:00.000Z&data_fim=${today}T23:59:59.999Z`;
      } else if (activeFilter === 'solicitacoes') query = '?status=aguardando_confirmacao';
      else if (activeFilter !== 'todos') query = `?status=${activeFilter}`;
      const result = await apiRequest(`/agendamentos${query}`);
      setAgendamentos(result.agendamentos || []);
      fetchTodosAgendamentos();
    } catch (error) { 
      if (!silent) notify(error.message || 'Não foi possível carregar a agenda.'); 
    }
    finally { 
      if (!silent) setLoading(false); 
    }
  }

  useEffect(() => {
    fetchAgenda(false);

    // Auto-update dashboard in real-time every 8 seconds (schedules sync)
    const intervalId = setInterval(() => {
      fetchAgenda(true);
    }, 8000);

    let handleSocketUpdate;
    if (socket) {
      handleSocketUpdate = (data) => {
        console.log('[SOCKET] Appointments changed:', data);
        fetchAgenda(true);
      };
      socket.on('appointments-changed', handleSocketUpdate);
    }

    return () => {
      clearInterval(intervalId);
      if (socket && handleSocketUpdate) {
        socket.off('appointments-changed', handleSocketUpdate);
      }
    };
  }, [activeFilter, socket]);

  async function openCreate() {
    try {
      const [clients, services] = await Promise.all([apiRequest('/clientes'), apiRequest('/servicos')]);
      setClientes(clients.clientes || []); setServicos(services.servicos || []); setModal('create-new');
    } catch (error) { notify(error.message || 'Erro ao carregar dados.'); }
  }

  async function openTransfer(item) {
    try { const result = await apiRequest('/profissionais'); setProfissionais(result.profissionais || []); setModal({ type: 'transfer', item }); }
    catch (error) { notify(error.message || 'Erro ao carregar profissionais.'); }
  }

  async function openPayment(item) {
    try {
      const result = await apiRequest('/caixa');
      const itemPayments = (result.movimentacoes || []).filter(m => Number(m.agendamento_id) === Number(item.id));
      const current = itemPayments[0];
      setPayments(itemPayments);
      setPaymentDraft({ gross: String(current?.valor ?? item.valor_total ?? 0), discount: String(current?.desconto ?? '0.00'), condition: current?.condicao_pagamento || 'a_vista', method: current?.forma_pagamento || 'pix', status: current?.status_pagamento || current?.status || 'pago', notes: current?.observacoes || '' });
      setModal({ type: 'payment-new', item });
    }
    catch (error) { notify(error.message || 'Erro ao carregar pagamentos.'); }
  }

  async function updateAppointment(item, data, message) {
    const previousAgendamentos = [...agendamentos];
    const previousTodos = [...todosAgendamentos];

    // Optimistic UI: atualização instantânea do estado em 0ms
    setAgendamentos(prev => prev.map(a => a.id === item.id ? { ...a, ...data } : a));
    setTodosAgendamentos(prev => prev.map(a => a.id === item.id ? { ...a, ...data } : a));
    setModal(null);
    if (message) notify(message);

    try {
      await apiRequest(`/agendamentos/${item.id}`, 'PUT', data);
      await fetchAgenda(true);
    } catch (error) {
      // Reverter estado otimista em caso de falha da rede ou conflito
      setAgendamentos(previousAgendamentos);
      setTodosAgendamentos(previousTodos);

      if (error.message && error.message.includes('já foi aceito')) {
        showAlert({ type: 'warning', title: 'Conflito de agendamento', message: error.message });
        fetchAgenda(true);
      } else {
        notify(error.message || 'Não foi possível atualizar o agendamento.');
      }
    }
  }

  async function createAppointment(event) {
    event.preventDefault();
    try {
      const service = servicos.find(s => Number(s.id) === Number(form.servico_id));
      let clientId = form.cliente_id;
      if (!clientId && form.cliente_nome) { const result = await apiRequest('/clientes', 'POST', { nome: form.cliente_nome, whatsapp: form.cliente_whatsapp }); clientId = result.cliente?.id; }
      await apiRequest('/agendamentos', 'POST', { cliente_id: clientId, servico_id: Number(form.servico_id), data_hora: new Date(form.data_hora).toISOString(), valor_total: service?.preco || 0, observacao: form.observacao, status: 'agendado' });
      setModal(null); notify('Agendamento criado.'); fetchAgenda();
    } catch (error) { notify(error.message || 'Erro ao criar agendamento.'); }
  }

  async function recordPayment(event, item) {
    event.preventDefault();
    try {
      const gross = Number(paymentDraft.gross || 0);
      const discount = Number(paymentDraft.discount || 0);
      await apiRequest('/caixa', 'POST', { agendamento_id: item.id, tipo: 'entrada', descricao: paymentDraft.notes || `Pagamento — ${item.cliente_nome || 'cliente'}`, valor: Math.max(0, gross - discount), status: paymentDraft.status === 'pago' ? 'pago' : 'a_receber', forma_pagamento: paymentDraft.method });
      notify('Pagamento registrado.'); await openPayment(item);
    } catch (error) { notify(error.message || 'Erro ao registrar pagamento.'); }
  }

  async function removeAppointment(item) {
    setDeleteModalItem(item);
  }

  async function confirmRemoveAppointment() {
    if (!deleteModalItem) return;
    const item = deleteModalItem;
    setDeleteModalItem(null);
    try {
      await apiRequest(`/agendamentos/${item.id}`, 'DELETE');
      notify('Agendamento excluído.');
      fetchAgenda();
    }
    catch (error) {
      notify(error.message || 'Erro ao excluir agendamento.');
    }
  }

  const filteredClients = useMemo(() => clientes.filter(c => (c.nome || '').toLowerCase().includes(clientSearch.toLowerCase())), [clientes, clientSearch]);
  const selectedStatus = modal?.item?.status;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <ModalAlert {...alertState} onClose={closeAlert} />
      {/* Modal de Mapa Interativo para Atendimentos à Domicílio */}
      <MapModal
        open={!!mapModal}
        onClose={() => setMapModal(null)}
        endereco={mapModal?.item?.endereco_externo}
        clienteNome={mapModal?.item?.cliente_nome}
        googleMapsUrl={mapModal ? getGoogleMapsUrl(mapModal.item?.endereco_externo) : '#'}
      />
      {modal?.type === 'payment-new' && <PaymentModal item={modal.item} payments={payments} draft={paymentDraft} setDraft={setPaymentDraft} onClose={() => setModal(null)} onSubmit={event => recordPayment(event, modal.item)} onOnline={() => setNestedModal({ type: 'online_payment', item: modal.item, valor: paymentDraft.gross || modal.item.valor_total })} />}
      {modal === 'create-new' && <NewAppointmentModal form={form} setForm={setForm} clients={filteredClients} services={servicos} onClose={() => setModal(null)} onSubmit={createAppointment} showAlert={showAlert} />}
      {toast && <div className="fixed right-5 top-5 z-[70] rounded-2xl border border-emerald-500/30 bg-slate-900 px-5 py-3 text-sm font-bold text-emerald-300 shadow-2xl">{toast}</div>}

      <div className="flex items-center justify-between w-full p-1">
        <div>
          <span className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-500">Gestão inteligente</span>
          <h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">Agenda</h1>
        </div>
        <button onClick={openCreate} className="btn-animated inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/25 shrink-0"><Plus className="h-5 w-5" /> <span className="hidden sm:inline">Novo Agendamento</span><span className="inline sm:hidden">Novo</span></button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/60 shadow-xl backdrop-blur-xl overflow-hidden w-full transition-all">
        <div
          onClick={() => setStatsOpen(!statsOpen)}
          className="flex items-center justify-between p-5 cursor-pointer select-none"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-500">Visão Geral</span>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">Indicadores de Hoje</h2>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50/80 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
            {statsOpen ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
          </div>
        </div>

        {statsOpen && (
          <div className="border-t border-slate-100 dark:border-slate-800/60 p-5 bg-slate-50/20 dark:bg-slate-950/10">
            
            {/* CONTROLES DE VISUALIZAÇÃO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Formato de Exibição</span>
              <div className="flex items-center gap-2">
                
                {statViewMode === 'grafico' && (
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/50 dark:bg-slate-800/80 mr-2">
                    <button onClick={() => setStatChartType('bar')} className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${statChartType === 'bar' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Coluna</button>
                    <button onClick={() => setStatChartType('line')} className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${statChartType === 'line' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Linha</button>
                    <button onClick={() => setStatChartType('area')} className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${statChartType === 'area' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Área</button>
                  </div>
                )}

                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/50 dark:bg-slate-800/80">
                  <button onClick={() => setStatViewMode('valores')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${statViewMode === 'valores' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Valores</button>
                  <button onClick={() => setStatViewMode('grafico')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${statViewMode === 'grafico' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Gráfico</button>
                </div>
              </div>
            </div>

            {/* CONTEÚDO (VALORES OU GRÁFICO) */}
            {statViewMode === 'valores' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                <div className="stat-card rounded-2xl border border-slate-100 dark:border-slate-800/85 bg-white dark:bg-slate-950/40 p-4 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">Solicitados</span>
                  <span className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white">{stats.solicitados}</span>
                </div>
                <div className="stat-card rounded-2xl border border-slate-100 dark:border-slate-800/85 bg-white dark:bg-slate-950/40 p-4 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">Confirmados</span>
                  <span className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white">{stats.confirmados}</span>
                </div>
                <div className="stat-card rounded-2xl border border-slate-100 dark:border-slate-800/85 bg-white dark:bg-slate-950/40 p-4 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Atendidos</span>
                  <span className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white">{stats.concluidos}</span>
                </div>
                <div className="stat-card rounded-2xl border border-slate-100 dark:border-slate-800/85 bg-white dark:bg-slate-950/40 p-4 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">Cancelados</span>
                  <span className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white">{stats.cancelados}</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-[200px] sm:h-[250px]">
                <Chart options={chartOptions} series={chartSeries} type={statChartType} height="100%" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3.5 no-scrollbar px-1 select-none">
        {filters.map(([key, label]) => {
          const isActive = activeFilter === key;
          const filterColors = {
            todos: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100',
            hoje: 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white border-blue-600 dark:border-blue-500',
            solicitacoes: 'bg-amber-500 text-white dark:bg-amber-500 dark:text-white border-amber-500',
            confirmados: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white border-emerald-600',
            cancelados: 'bg-rose-600 text-white dark:bg-rose-500 dark:text-white border-rose-600',
          };
          const colorClass = filterColors[key] || 'bg-blue-600 text-white border-blue-600';

          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`
                flex-shrink-0 whitespace-nowrap rounded-2xl px-4.5 py-2 text-xs font-black transition-all duration-200 border
                ${isActive
                  ? `${colorClass} shadow-sm scale-[1.02]`
                  : 'border-slate-200/80 bg-white/90 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:text-white'
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm font-semibold text-slate-400">Carregando compromissos...</div>
      ) : agendamentos.length === 0 ? (
        <div className="rounded-3xl border border-slate-300/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 p-12 text-center text-slate-400">
          <Calendar className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Nenhum compromisso encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agendamentos.map(item => {
            const parts = dateParts(item.data_hora);
            const isRequest = ['aguardando_confirmacao', 'solicitado'].includes(item.status);
            const isManutencao = item.status === 'manutencao';
            const isAtendimentoExterno = (item.tipo_atendimento || 'salao').toLowerCase() === 'cliente' || (item.tipo_atendimento || 'salao').toLowerCase() === 'externo' || (item.tipo_atendimento || 'salao').toLowerCase() === 'domicilio';

            return (
              <div
                key={item.id}
                className={`appointment-card group p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border border-white/80 dark:border-slate-800/60 bg-white/72 dark:bg-slate-950/20 hover:bg-white/90 dark:hover:bg-slate-800/30 shadow-[0_14px_36px_rgba(15,23,42,0.08)] hover:shadow-[0_18px_44px_rgba(37,99,235,0.12)] backdrop-blur-sm transition-all rounded-3xl ${isManutencao ? 'ring-1 ring-purple-200/70 dark:ring-purple-500/15' : ''
                  }`}
                onClick={() => setModal({ type: 'details', item })}
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl font-bold ${isManutencao
                      ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40'
                      : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40'
                      }`}
                  >
                    <span className="text-[10px] font-semibold uppercase">{parts.month}</span>
                    <span className="text-sm font-extrabold leading-none">{parts.day}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {item.cliente_nome && item.cliente_nome !== 'Cliente' && item.cliente_nome !== 'Cliente não identificado'
                          ? item.cliente_nome
                          : (item.temp_cliente_nome || item.cliente_nome || 'Cliente')}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusClasses[item.status] || statusClasses.agendado
                          }`}
                      >
                        {statusLabels[item.status] || item.status}
                      </span>

                      {item.profissional_nome && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white shadow-sm shrink-0"
                          style={{ backgroundColor: item.profissional_cor || '#8b5cf6' }}
                        >
                          <User className="h-2.5 w-2.5 shrink-0" /> {item.profissional_nome}
                        </span>
                      )}

                      {isAtendimentoExterno ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                            <Home className="h-2.5 w-2.5" /> Domicílio
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModal({ type: 'address', item });
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold px-3 py-1.5 rounded-full bg-purple-600/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 hover:bg-purple-600 hover:text-white transition shadow-sm"
                            title="Editar Endereço Domiciliar"
                          >
                            <MapPin className="h-2.5 w-2.5" /> Endereço
                          </button>
                          <a
                            href={getGoogleMapsUrl(item.endereco_externo)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-sm"
                            title="Abrir localização no Google Maps"
                          >
                            <MapPin className="h-2.5 w-2.5" /> Maps
                          </a>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-300 border border-slate-500/20 shrink-0">
                          No salão
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <Scissors className="h-3.5 w-3.5 text-blue-400" />
                      {item.servico_nome || 'Atendimento'}{' '}
                      <span className="font-semibold text-slate-400">({item.duracao_total_minutos || 60} min)</span>
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                      <span>
                        <Clock className="mr-1 inline h-3 w-3" />
                        {formatTime(item.data_hora)}
                      </span>
                      <span>
                        <CalendarDays className="mr-1 inline h-3 w-3" />
                        {formatDate(item.data_hora)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1.5" onClick={event => event.stopPropagation()}>
                  {isRequest ? (
                    <>
                      <button
                        onClick={() => updateAppointment(item, { status: 'confirmado' }, 'Solicitação aceita e confirmada com sucesso!')}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-500 transition shadow"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => updateAppointment(item, { status: 'recusado' }, 'Solicitação recusada.')}
                        className="rounded-xl bg-rose-500/15 px-3 py-2 text-xs font-black text-rose-300"
                      >
                        Recusar
                      </button>
                    </>
                  ) : (
                    <>
                      <ActionButton kind="notes" label="Registrar observação" onClick={() => setModal({ type: 'notes', item })}>
                        <div className="relative flex items-center justify-center">
                          <MessageSquare className="h-4 w-4" />
                          {getDisplayObservacao(item.observacao) && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-sm shadow-amber-500/50"></span>
                            </span>
                          )}
                        </div>
                      </ActionButton>
                      {item.cliente_whatsapp && (
                        <a
                          href={`https://wa.me/55${item.cliente_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                            getWhatsAppMessage(item)
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${buttonStyles.whatsapp}`}
                          title={item.status === 'manutencao' ? 'Lembrete Manutenção' : 'Enviar Confirmação'}
                        >
                          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                          </svg>
                        </a>
                      )}
                      <ActionButton kind="payment" label="Registrar / ver pagamentos" onClick={() => openPayment(item)}>
                        <DollarSign className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton kind="transfer" label="Transferir agendamento" onClick={() => openTransfer(item)}>
                        <ArrowRightLeft className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton kind="delete" label="Excluir agendamento" onClick={() => removeAppointment(item)}>
                        <Trash2 className="h-4 w-4" />
                      </ActionButton>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal?.type === 'details' && (
        <DetailsModal
          item={modal.item}
          onClose={() => setModal(null)}
          onUpdateStatus={updateAppointment}
          onOpenMaintenance={(item) => setModal({ type: 'maintenance', item })}
          onEditFull={(item) => setModal({ type: 'edit', item })}
          onOpenMap={(item) => { setModal(null); setMapModal({ item }); }}
        />
      )}

      {modal?.type === 'status' && (
        <Modal title={modal.item.cliente_nome} subtitle={modal.item.cliente_whatsapp} onClose={() => setModal(null)}>
          <div className="grid gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {[
              ['agendado', 'Confirmado'],
              ['em_atendimento', 'Em Atendimento'],
              ['concluido', 'Já Atendido / Concluído'],
              ['manutencao', 'Agendar Manutenção Periódica'],
              ['cancelado', 'Cancelado / Recusado']
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => updateAppointment(modal.item, { status: value }, `Status alterado para ${label}.`)}
                className={`rounded-2xl border p-4 text-left text-sm font-black transition-all ${selectedStatus === value
                  ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-500/5'
                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                  }`}
              >
                {label}
                {selectedStatus === value && <Check className="float-right h-4 w-4 text-blue-600 dark:text-blue-400" />}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {modal?.type === 'notes' && (
        <NotesModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSave={updateAppointment}
        />
      )}

      {modal?.type === 'maintenance' && (
        <Modal title="Manutenção Periódica" subtitle={`${modal.item.cliente_nome || 'Cliente'} — ${modal.item.servico_nome || 'Atendimento'}`} onClose={() => setModal(null)}>
          <form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); const date = `${data.get('date')}T${data.get('time')}`; apiRequest('/agendamentos', 'POST', { cliente_id: modal.item.cliente_id, profissional_id: modal.item.profissional_id, servico_id: modal.item.servico_id, data_hora: new Date(date).toISOString(), valor_total: modal.item.valor_total || 0, observacao: data.get('observacao'), status: 'agendado' }).then(() => { notify('Manutenção agendada.'); setModal(null); fetchAgenda(); }).catch(error => notify(error.message || 'Erro ao agendar manutenção.')); }} className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 w-full">
              {[15, 30, 45, 60, 90].map(days => (
                <button type="button" key={days} onClick={event => { const date = new Date(modal.item.data_hora); date.setDate(date.getDate() + days); event.currentTarget.form.date.value = date.toISOString().slice(0, 10); }} className="btn-animated rounded-xl border border-slate-200 hover:border-purple-500 py-2.5 text-center text-xs font-black text-slate-700 dark:border-slate-800 dark:text-slate-300 dark:hover:border-purple-500">{days}d</button>
              ))}
            </div>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              Data de retorno
              <input name="date" type="date" defaultValue={new Date(new Date(modal.item.data_hora).getTime() + 30 * 86400000).toISOString().slice(0, 10)} className={`${inputClass} mt-1`} required />
            </label>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              Horário
              <input name="time" type="time" defaultValue={formatTime(modal.item.data_hora)} className={`${inputClass} mt-1`} required />
            </label>
            <textarea name="observacao" rows="3" className={inputClass} placeholder="Observações (opcional)" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="btn-animated rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">Não agendar</button>
              <button className="btn-animated rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-xs font-black text-white shadow-lg shadow-purple-500/20">Confirmar e agendar</button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === 'payment' && (
        <PaymentModal
          item={modal.item}
          payments={payments}
          draft={paymentDraft}
          setDraft={setPaymentDraft}
          onClose={() => setModal(null)}
          onSubmit={(event) => recordPayment(event, modal.item)}
          onOnline={() => setNestedModal({ type: 'online_payment', item: modal.item, valor: paymentDraft.gross || modal.item.valor_total })}
        />
      )}

      {nestedModal?.type === 'online_payment' && (
        <OnlinePaymentModal
          item={nestedModal.item}
          valor={nestedModal.valor}
          onClose={() => setNestedModal(null)}
          notify={notify}
        />
      )}

      {modal?.type === 'online_payment' && (
        <OnlinePaymentModal
          item={modal.item}
          valor={modal.valor}
          onClose={() => setModal(null)}
          notify={notify}
        />
      )}

      {modal?.type === 'transfer' && (
        <Modal title="Transferir agendamento" subtitle={modal.item.cliente_nome} onClose={() => setModal(null)}>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {profissionais.map(professional => (
              <button key={professional.id} onClick={() => updateAppointment(modal.item, { profissional_id: professional.id }, `Agendamento transferido para ${professional.nome}.`)} className="btn-animated flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white/50 hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 p-4 text-left text-sm font-black text-slate-700 dark:text-slate-200"><User className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />{professional.nome}</button>
            ))}
            {!profissionais.length && <p className="text-center text-sm text-slate-400 font-medium">Nenhum profissional disponível.</p>}
          </div>
        </Modal>
      )}

      {modal?.type === 'address' && (
        <Modal 
          title="Editar Endereço a Domicílio" 
          subtitle={`${modal.item.cliente_nome || 'Cliente'} — ${modal.item.servico_nome || 'Atendimento'}`} 
          onClose={() => setModal(null)}
        >
          {(() => {
            let currentEnd = { rua: '', numero: '', bairro: '', complemento: '' };
            if (modal.item.endereco_externo) {
              if (typeof modal.item.endereco_externo === 'object') {
                currentEnd = { ...currentEnd, ...modal.item.endereco_externo };
              } else {
                try {
                  const parsed = JSON.parse(modal.item.endereco_externo);
                  if (typeof parsed === 'object') currentEnd = { ...currentEnd, ...parsed };
                } catch (e) {
                  currentEnd.rua = String(modal.item.endereco_externo);
                }
              }
            }

            return (
              <AddressMapModalContent
                currentEnd={currentEnd}
                onSave={(newAddr) => {
                  const payload = { endereco_externo: newAddr };
                  updateAppointment(modal.item, payload, 'Endereço a domicílio atualizado!');
                }}
              />
            );
          })()}
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Editar agendamento" subtitle={modal.item.cliente_nome} onClose={() => setModal(null)}>
          <form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); updateAppointment(modal.item, { data_hora: new Date(data.get('data_hora')).toISOString(), observacao: data.get('observacao'), valor_total: Number(data.get('valor_total')), status: data.get('status') }, 'Agendamento atualizado.'); }} className="space-y-4">
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Data e horário
              <input name="data_hora" type="datetime-local" defaultValue={new Date(modal.item.data_hora).toISOString().slice(0, 16)} className={`${inputClass} mt-1`} required />
            </label>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Valor
              <input name="valor_total" type="number" step="0.01" defaultValue={modal.item.valor_total || 0} className={`${inputClass} mt-1`} />
            </label>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Status
              <PremiumSelect name="status" defaultValue={modal.item.status} className="mt-1">
                {Object.entries(statusLabels).filter(([key]) => !['aguardando_confirmacao', 'solicitado', 'confirmado', 'atendido', 'recusado'].includes(key)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </PremiumSelect>
            </label>
            <textarea name="observacao" rows="3" defaultValue={modal.item.observacao || ''} className={inputClass} placeholder="Observações" />
            <button className="btn-animated w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-black text-white shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700">Salvar alterações</button>
          </form>
        </Modal>
      )}

      {modal === 'create' && (
        <Modal title="Novo Agendamento" subtitle="Preencha os dados do atendimento" onClose={() => setModal(null)}>
          <form onSubmit={createAppointment} className="space-y-4">
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Cliente
              <input value={form.cliente_nome} onChange={event => setForm({ ...form, cliente_nome: event.target.value, cliente_id: '' })} className={`${inputClass} mt-1`} placeholder="Nome do cliente" required />
            </label>
            {form.cliente_nome && filteredClients.length > 0 && (
              <div className="max-h-28 overflow-y-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                {filteredClients.slice(0, 5).map(client => (
                  <button type="button" key={client.id} onClick={() => setForm({ ...form, cliente_id: client.id, cliente_nome: client.nome, cliente_whatsapp: client.whatsapp || '' })} className="block w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{client.nome}</button>
                ))}
              </div>
            )}
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">WhatsApp
              <input value={form.cliente_whatsapp} onChange={event => setForm({ ...form, cliente_whatsapp: event.target.value })} className={`${inputClass} mt-1`} placeholder="(11) 99999-9999" type="tel" inputMode="tel" />
            </label>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Serviço
              <PremiumSelect value={form.servico_id} onChange={event => setForm({ ...form, servico_id: event.target.value })} className="mt-1" required>
                <option value="">Selecione um serviço</option>
                {servicos.map(service => <option key={service.id} value={service.id}>{service.nome} — R$ {Number(service.preco || 0).toFixed(2)}</option>)}
              </PremiumSelect>
            </label>
            <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Data e horário
              <input value={form.data_hora} onChange={event => setForm({ ...form, data_hora: event.target.value })} type="datetime-local" className={`${inputClass} mt-1`} required />
            </label>
            <textarea value={form.observacao} onChange={event => setForm({ ...form, observacao: event.target.value })} rows="3" className={inputClass} placeholder="Observações (opcional)" />
            <button className="btn-animated w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-black text-white shadow-lg shadow-blue-500/25">Confirmar agendamento</button>
          </form>
        </Modal>
      )}

      {deleteModalItem && (
        <Modal
          title="Excluir Agendamento"
          subtitle={deleteModalItem.cliente_nome || 'Atenção'}
          onClose={() => setDeleteModalItem(null)}
        >
          <div className="space-y-4 pt-1">
            <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold leading-relaxed">
                Tem certeza absoluta que deseja excluir este agendamento de <strong className="font-black">{deleteModalItem.cliente_nome}</strong>? Esta ação é irreversível e removerá todos os dados vinculados.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                className="btn-animated rounded-2xl px-5 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRemoveAppointment}
                className="btn-animated flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 px-6 py-3 text-xs font-black text-white shadow-lg shadow-rose-500/25"
              >
                <Trash2 className="h-4 w-4" />
                Sim, excluir agendamento
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
