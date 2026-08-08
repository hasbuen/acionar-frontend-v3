import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, MessageSquareText, RefreshCw, Star, Trophy, UserRound } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useModalAlert, ModalAlert } from '../components/ModalAlert';

const TABS = [
  { id: 'visao-geral', label: 'Visão geral', icon: BarChart3 },
  { id: 'avaliacoes', label: 'Comentários', icon: MessageSquareText },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
];

const formatDate = value => value ? new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatRating = value => Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function Avaliacoes() {
  const { user } = useAuth();
  const { alertState, showAlert, closeAlert } = useModalAlert();
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [reviews, setReviews] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const canViewTenant = ['proprietario', 'administrador'].includes(user?.cargo);

  const loadData = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const reviewQuery = canViewTenant && selectedProfessional ? `?profissional_id=${encodeURIComponent(selectedProfessional)}` : '';
      const [reviewResponse, rankingResponse] = await Promise.all([
        apiRequest(`/avaliacoes${reviewQuery}`),
        apiRequest('/avaliacoes/ranking'),
      ]);
      setReviews(reviewResponse?.reviews || []);
      setRanking(rankingResponse?.ranking || []);
    } catch (error) {
      showAlert({ type: 'error', title: 'Não foi possível carregar', message: error.message || 'Tente novamente em alguns instantes.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedProfessional, canViewTenant]);

  const summary = useMemo(() => {
    const total = reviews.length;
    const average = total ? reviews.reduce((sum, review) => sum + Number(review.nota || 0), 0) / total : 0;
    const positive = reviews.filter(review => Number(review.nota) >= 4).length;
    return { total, average, positivePercent: total ? Math.round((positive / total) * 100) : 0 };
  }, [reviews]);

  const professionals = useMemo(() => ranking.map(item => ({ id: item.profissional_id, name: item.profissional_nome })), [ranking]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ModalAlert {...alertState} onClose={closeAlert} />
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[.2em]" style={{ color: 'var(--tenant-primary, #2563eb)' }}>Experiência do cliente</span>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Avaliações</h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">Acompanhe o que seus clientes estão dizendo e reconheça os melhores atendimentos.</p>
        </div>
        <button onClick={() => loadData({ silent: true })} disabled={loading || refreshing} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </header>

      {canViewTenant && (
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400"><UserRound className="h-4 w-4" /> Filtrar profissional</label>
          <select value={selectedProfessional} onChange={event => setSelectedProfessional(event.target.value)} className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:min-w-64">
            <option value="">Todos os profissionais</option>
            {professionals.map(professional => <option key={professional.id} value={professional.id}>{professional.name}</option>)}
          </select>
        </div>
      )}

      <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/70 p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        {TABS.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-black transition ${activeTab === id ? 'text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`} style={activeTab === id ? { background: 'var(--tenant-primary, #2563eb)' } : undefined}><Icon className="h-4 w-4" />{label}</button>)}
      </div>

      {loading ? <LoadingState /> : <>
        {activeTab === 'visao-geral' && <Overview summary={summary} ranking={ranking} />}
        {activeTab === 'avaliacoes' && <Reviews reviews={reviews} />}
        {activeTab === 'ranking' && <Ranking ranking={ranking} canViewTenant={canViewTenant} />}
      </>}
    </div>
  );
}

function Overview({ summary, ranking }) {
  const top = ranking[0];
  return <div className="space-y-5">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Metric label="Nota média" value={formatRating(summary.average)} detail="de 5 estrelas" icon={<Star className="h-5 w-5" />} />
      <Metric label="Avaliações recebidas" value={summary.total} detail="feedbacks registrados" icon={<MessageSquareText className="h-5 w-5" />} />
      <Metric label="Experiências positivas" value={`${summary.positivePercent}%`} detail="notas 4 ou 5" icon={<Trophy className="h-5 w-5" />} />
    </div>
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black text-slate-900 dark:text-white">Destaque do período</h2><p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Profissional com melhor média entre as avaliações recebidas.</p></div>{top && <div className="flex items-center gap-3 rounded-2xl bg-amber-500/10 px-4 py-3"><Trophy className="h-5 w-5 text-amber-500" /><div><p className="text-sm font-black text-slate-900 dark:text-white">{top.profissional_nome}</p><p className="text-xs font-bold text-amber-600">{formatRating(top.media_nota)} • {top.total_avaliacoes} avaliações</p></div></div>}</div>
      {!top && <EmptyState title="Ainda não há avaliações" message="Quando seus clientes responderem à pesquisa, o resumo aparecerá aqui." />}
    </section>
  </div>;
}

function Metric({ label, value, detail, icon }) { return <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span><span className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">{icon}</span></div><p className="mt-5 text-3xl font-black text-slate-900 dark:text-white">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{detail}</p></div>; }

function Reviews({ reviews }) { return <section className="rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"><div className="mb-5"><h2 className="text-lg font-black text-slate-900 dark:text-white">Feedback dos clientes</h2><p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Comentários individuais do seu tenant.</p></div>{reviews.length === 0 ? <EmptyState title="Nenhum feedback ainda" message="As avaliações enviadas pelos clientes aparecerão nesta lista." /> : <div className="space-y-3">{reviews.map(review => <article key={review.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-black text-slate-900 dark:text-white">{review.cliente_nome || 'Cliente'}</p><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{review.servico_nome || 'Atendimento'}{review.profissional_nome ? ` • ${review.profissional_nome}` : ''}</p></div><div className="flex items-center gap-2"><div className="flex" aria-label={`${review.nota} estrelas`}>{[1,2,3,4,5].map(value => <Star key={value} className="h-4 w-4" fill={value <= review.nota ? 'var(--tenant-primary, #2563eb)' : 'transparent'} color={value <= review.nota ? 'var(--tenant-primary, #2563eb)' : '#94a3b8'} />)}</div><time className="text-[10px] font-bold text-slate-400">{formatDate(review.created_at)}</time></div></div>{review.comentario && <p className="mt-3 rounded-xl bg-white p-3 text-sm font-medium leading-relaxed text-slate-600 dark:bg-slate-900 dark:text-slate-300">“{review.comentario}”</p>}</article>)}</div>}</section>; }

function Ranking({ ranking, canViewTenant }) { return <section className="rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"><div className="mb-5"><h2 className="text-lg font-black text-slate-900 dark:text-white">{canViewTenant ? 'Ranking do tenant' : 'Minha performance'}</h2><p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{canViewTenant ? 'Compare a experiência entregue por cada profissional.' : 'Acompanhe suas avaliações sem acessar dados de outros profissionais.'}</p></div>{ranking.length === 0 ? <EmptyState title="Ranking em formação" message="Ainda não há profissionais com avaliações registradas." /> : <div className="space-y-3">{ranking.map((item, index) => <div key={item.profissional_id} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${index === 0 ? 'bg-amber-500/15 text-amber-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900 dark:text-white">{item.profissional_nome}</p><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{item.total_avaliacoes} avaliações</p></div><div className="text-right"><p className="flex items-center gap-1 text-sm font-black text-slate-900 dark:text-white"><Star className="h-4 w-4" fill="var(--tenant-primary, #2563eb)" color="var(--tenant-primary, #2563eb)" /> {formatRating(item.media_nota)}</p><p className="text-[10px] font-bold text-slate-400">média</p></div></div>)}</div>}</section>; }

function EmptyState({ title, message }) { return <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800"><p className="text-sm font-black text-slate-700 dark:text-slate-200">{title}</p><p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{message}</p></div>; }
function LoadingState() { return <div className="grid gap-4 sm:grid-cols-3"><div className="h-36 animate-pulse rounded-[2rem] bg-slate-200/70 dark:bg-slate-800/70 sm:col-span-3" /><div className="h-48 animate-pulse rounded-[2rem] bg-slate-200/70 dark:bg-slate-800/70 sm:col-span-3" /></div>; }
