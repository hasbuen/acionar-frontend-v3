import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, MessageCircle, Star, ThumbsUp } from 'lucide-react';

const DEFAULT_COLORS = {
  primary: '#2563eb',
  highlight: '#f59e0b',
  background: '#020617',
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
};

function normalizeHex(value, fallback) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function toRgb(hex) {
  const value = hex.replace('#', '');
  return `${parseInt(value.slice(0, 2), 16)}, ${parseInt(value.slice(2, 4), 16)}, ${parseInt(value.slice(4, 6), 16)}`;
}

export function AvaliacaoPublica({ slug: propSlug, appointmentId: propAppointmentId }) {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const slug = propSlug || pathParts[1] || '';
  const appointmentId = propAppointmentId || pathParts[2] || '';
  const [tenant, setTenant] = useState(null);
  const [details, setDetails] = useState(null);
  const [note, setNote] = useState(0);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('loading');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!slug || !appointmentId) {
        setStatus('error');
        setError('Link de avaliação inválido.');
        return;
      }

      try {
        const [tenantResponse, statusResponse] = await Promise.all([
          fetch(`/api/public/tenant/${encodeURIComponent(slug)}`),
          fetch(`/api/public/tenant/${encodeURIComponent(slug)}/agendamentos/${encodeURIComponent(appointmentId)}/avaliacao-status`),
        ]);
        const tenantData = await tenantResponse.json().catch(() => null);
        const evaluationData = await statusResponse.json().catch(() => null);
        if (!tenantResponse.ok || !tenantData?.tenant) throw new Error('Estabelecimento não encontrado.');
        if (!statusResponse.ok) throw new Error(evaluationData?.message || 'Não foi possível carregar esta avaliação.');
        if (cancelled) return;
        setTenant(tenantData.tenant);
        setDetails(evaluationData);
        setStatus('ready');
      } catch (loadError) {
        if (!cancelled) {
          setStatus('error');
          setError(loadError.message || 'Não foi possível carregar a avaliação.');
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug, appointmentId]);

  const colors = useMemo(() => ({
    primary: normalizeHex(tenant?.cor_primaria, DEFAULT_COLORS.primary),
    highlight: normalizeHex(tenant?.cor_destaque, DEFAULT_COLORS.highlight),
    background: normalizeHex(tenant?.cor_fundo, DEFAULT_COLORS.background),
    textPrimary: normalizeHex(tenant?.cor_texto_principal, DEFAULT_COLORS.textPrimary),
    textSecondary: normalizeHex(tenant?.cor_texto_secundario, DEFAULT_COLORS.textSecondary),
  }), [tenant]);

  const customStyle = {
    '--rating-primary': colors.primary,
    '--rating-primary-rgb': toRgb(colors.primary),
    '--rating-highlight': colors.highlight,
    '--rating-background': colors.background,
    '--rating-text': colors.textPrimary,
    '--rating-muted': colors.textSecondary,
  };

  const submit = async (event) => {
    event.preventDefault();
    if (note < 1 || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/api/public/tenant/${encodeURIComponent(slug)}/agendamentos/${encodeURIComponent(appointmentId)}/avaliar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota: note, comentario: comment.trim() || undefined }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || 'Não foi possível enviar sua avaliação.');
      setStatus('success');
    } catch (submitError) {
      setError(submitError.message || 'Não foi possível enviar sua avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderState = () => {
    if (status === 'loading') {
      return <StateCard icon={<Loader2 className="h-8 w-8 animate-spin" />} title="Carregando avaliação" message="Só um instante..." />;
    }
    if (status === 'error') {
      return <StateCard icon={<MessageCircle className="h-8 w-8" />} title="Link indisponível" message={error} />;
    }
    if (status === 'success') {
      return <StateCard icon={<CheckCircle2 className="h-10 w-10" />} title="Obrigado pelo seu feedback!" message="Sua avaliação ajuda o estabelecimento a oferecer uma experiência cada vez melhor." success />;
    }
    if (!details?.eligible) {
      return <StateCard icon={<ThumbsUp className="h-9 w-9" />} title="Avaliação já encerrada" message={details?.ja_avaliado ? 'Este atendimento já recebeu uma avaliação.' : 'Este atendimento ainda não está disponível para avaliação.'} />;
    }

    return (
      <form onSubmit={submit} className="space-y-6">
        <div className="text-center">
          <p className="text-sm font-semibold opacity-80">Como foi seu atendimento?</p>
          <div className="mt-4 flex justify-center gap-2" role="radiogroup" aria-label="Nota do atendimento">
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={note === value}
                aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
                onClick={() => setNote(value)}
                className="rounded-2xl p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                <Star className="h-10 w-10 sm:h-12 sm:w-12" fill={note >= value ? 'var(--rating-highlight)' : 'transparent'} color={note >= value ? 'var(--rating-highlight)' : 'currentColor'} strokeWidth={1.5} />
              </button>
            ))}
          </div>
          <p className="mt-3 min-h-5 text-xs font-bold opacity-70">{note ? `${note} de 5 estrelas` : 'Toque nas estrelas para avaliar'}</p>
        </div>

        <label className="block text-left">
          <span className="text-xs font-black uppercase tracking-wider opacity-75">Quer contar mais? <span className="font-semibold normal-case opacity-70">(opcional)</span></span>
          <textarea
            value={comment}
            onChange={event => setComment(event.target.value.slice(0, 500))}
            rows={4}
            placeholder="Escreva um comentário curto..."
            className="mt-2 w-full resize-none rounded-2xl border border-white/15 bg-black/15 px-4 py-3 text-sm outline-none transition focus:border-white/50"
            style={{ color: 'var(--rating-text)' }}
          />
          <span className="mt-1 block text-right text-[10px] opacity-55">{comment.length}/500</span>
        </label>

        {error && <p className="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-center text-xs font-bold text-rose-100">{error}</p>}

        <button
          type="submit"
          disabled={!note || submitting}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white shadow-xl transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'var(--rating-primary)', boxShadow: '0 14px 28px rgba(var(--rating-primary-rgb), .28)' }}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Enviando...' : 'Enviar avaliação'}
        </button>
      </form>
    );
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-4 font-sans" style={{ ...customStyle, background: 'var(--rating-background)', color: 'var(--rating-text)' }}>
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 shadow-2xl backdrop-blur-xl">
        <div className="p-6 pb-5 text-center sm:p-8 sm:pb-6" style={{ background: 'linear-gradient(135deg, rgba(var(--rating-primary-rgb), .32), transparent)' }}>
          {tenant?.foto_url ? <img src={tenant.foto_url} alt="" className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-lg" /> : <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg" style={{ background: 'var(--rating-primary)' }}>{(tenant?.nome_empresa || 'A').charAt(0).toUpperCase()}</div>}
          <p className="mt-4 text-[10px] font-black uppercase tracking-[.2em] opacity-65">Pesquisa de satisfação</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">{tenant?.nome_empresa || 'Seu atendimento'}</h1>
          {details?.eligible && <p className="mt-2 text-sm opacity-75">{details.servico_nome} com {details.profissional_nome}</p>}
        </div>
        <div className="p-6 sm:p-8">{renderState()}</div>
      </div>
    </main>
  );
}

function StateCard({ icon, title, message, success = false }) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: success ? 'rgba(16, 185, 129, .16)' : 'rgba(255, 255, 255, .08)', color: success ? '#34d399' : 'var(--rating-primary)' }}>{icon}</div>
      <h2 className="mt-5 text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed opacity-70">{message}</p>
    </div>
  );
}
