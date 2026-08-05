import React from 'react';
import { Banknote, CalendarDays, CheckCircle, Clock, CreditCard, Link, QrCode, ShieldCheck, WalletCards, X, Zap } from 'lucide-react';

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100';

function Choice({ active, onClick, children, vertical = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex ${vertical ? 'flex-col' : ''} items-center justify-center gap-1.5 rounded-2xl border p-2.5 text-xs font-extrabold transition ${
        active
          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
          : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400 dark:hover:bg-slate-800/50'
      }`}
    >
      {children}
    </button>
  );
}

export function PaymentModal({ item, payments, draft, setDraft, onClose, onSubmit, onOnline }) {
  const finalValue = Math.max(0, Number(draft.gross || 0) - Number(draft.discount || 0));

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center overflow-y-auto bg-slate-950/15 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="my-0 max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-[2.2rem] border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 sm:my-auto sm:rounded-[2.2rem] sm:p-7">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black">
              $
            </div>
            <div>
              <h3 className="text-base font-black leading-tight text-slate-950 dark:text-white">Registrar Pagamento</h3>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Vinculado ao caixa do estabelecimento</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50 dark:border-slate-800/60 dark:bg-slate-950/50 p-3.5">
            <div>
              <span className="block text-xs font-black text-slate-900 dark:text-white">{item.cliente_nome || 'Cliente'}</span>
              <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">{item.servico_nome || 'Serviço'}</span>
            </div>
            <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400">Fluxo de Caixa</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Valor Bruto (R$)
              <input type="number" step="0.01" value={draft.gross} onChange={e => setDraft({ ...draft, gross: e.target.value })} className={`${inputClass} mt-1`} required />
            </label>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Desconto (R$)
              <input type="number" step="0.01" value={draft.discount} onChange={e => setDraft({ ...draft, discount: e.target.value })} className={`${inputClass} mt-1`} />
            </label>
            <label className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Valor Final (R$)
              <input readOnly value={finalValue.toFixed(2)} className="mt-1 w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-black text-emerald-600 dark:text-emerald-400" />
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Condição de Pagamento</label>
            <div className="grid grid-cols-2 gap-2">
              <Choice active={draft.condition === 'a_vista'} onClick={() => setDraft({ ...draft, condition: 'a_vista' })}><Zap className="h-3.5 w-3.5" />À Vista</Choice>
              <Choice active={draft.condition === 'a_prazo'} onClick={() => setDraft({ ...draft, condition: 'a_prazo' })}><CalendarDays className="h-3.5 w-3.5" />À Prazo / Fiado</Choice>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Forma de Pagamento</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Choice vertical active={draft.method === 'pix'} onClick={() => setDraft({ ...draft, method: 'pix' })}><QrCode className="h-4 w-4" />PIX</Choice>
              <Choice vertical active={draft.method === 'cartao_credito'} onClick={() => setDraft({ ...draft, method: 'cartao_credito' })}><CreditCard className="h-4 w-4" />C. Crédito</Choice>
              <Choice vertical active={draft.method === 'cartao_debito'} onClick={() => setDraft({ ...draft, method: 'cartao_debito' })}><WalletCards className="h-4 w-4" />C. Débito</Choice>
              <Choice vertical active={draft.method === 'dinheiro'} onClick={() => setDraft({ ...draft, method: 'dinheiro' })}><Banknote className="h-4 w-4" />Dinheiro</Choice>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Status do Lançamento</label>
            <div className="grid grid-cols-2 gap-2">
              <Choice active={draft.status === 'pago'} onClick={() => setDraft({ ...draft, status: 'pago' })}><CheckCircle className="h-3.5 w-3.5" />Pago / Recebido</Choice>
              <Choice active={draft.status === 'a_receber'} onClick={() => setDraft({ ...draft, status: 'a_receber' })}><Clock className="h-3.5 w-3.5" />À Receber / Pendente</Choice>
            </div>
          </div>

          <input value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} placeholder="Observações do caixa (opcional)" className={`${inputClass} px-4`} />

          <div className="space-y-3 rounded-3xl border border-blue-500/25 bg-blue-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-xs font-black text-slate-900 dark:text-white">Cobrança online segura</span>
                <span className="block text-[11px] font-semibold leading-relaxed text-slate-500 dark:text-slate-400">Gera um link para o cliente escolher Pix ou cartão. O Pix exibe o QR Code no checkout.</span>
              </div>
            </div>
            <button type="button" onClick={onOnline} className="btn-animated flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-5 py-3.5 text-xs font-black text-white shadow-lg shadow-blue-500/20">
              <Link className="h-4 w-4" />
              Gerar cobrança Pix ou cartão
            </button>
          </div>

          <button className="btn-animated w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20">Registrar pagamento</button>
        </form>

        {payments.length > 0 && <div className="border-t border-slate-100 dark:border-slate-800 pt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">{payments.length} lançamento(s) já registrado(s) neste atendimento.</div>}
      </div>
    </div>
  );
}
