import React, { useState } from 'react';
import { Calendar, Search, UserRound, X } from 'lucide-react';

const inputClass = 'w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500';

export function NewAppointmentModal({ form, setForm, clients, services, onClose, onSubmit }) {
  const [finderOpen, setFinderOpen] = useState(false);
  const [search, setSearch] = useState('');
  const matches = clients.filter(client => (client.nome || '').toLowerCase().includes(search.toLowerCase()) || (client.whatsapp || '').includes(search)).slice(0, 8);

  const selectClient = client => {
    setForm({ ...form, cliente_id: client.id, cliente_nome: client.nome, cliente_whatsapp: client.whatsapp || '' });
    setFinderOpen(false);
    setSearch('');
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
    <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
      <div className="mb-5 flex items-start justify-between border-b border-slate-800 pb-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-300"><Calendar className="h-5 w-5" /></div><div><h3 className="text-lg font-black text-white">Novo Agendamento</h3><p className="text-[11px] font-semibold text-slate-400">Encontre um cliente ou cadastre um novo</p></div></div><button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button></div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div><div className="mb-1.5 flex items-center justify-between"><label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Cliente</label><button type="button" onClick={() => setFinderOpen(!finderOpen)} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-[11px] font-black text-blue-300 hover:bg-blue-500/20"><Search className="h-3.5 w-3.5" />{finderOpen ? 'Digitar nome' : 'Buscar cadastrado'}</button></div><input value={form.cliente_nome} onChange={event => setForm({ ...form, cliente_nome: event.target.value, cliente_id: '' })} className={inputClass} placeholder="Nome do cliente" required />{finderOpen && <div className="mt-2 rounded-2xl border border-slate-700 bg-slate-950 p-3"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input autoFocus value={search} onChange={event => setSearch(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-3 text-xs font-semibold text-white outline-none focus:border-blue-500" placeholder="Buscar por nome ou WhatsApp" /></div><div className="mt-2 max-h-40 space-y-1 overflow-y-auto">{matches.length ? matches.map(client => <button type="button" key={client.id} onClick={() => selectClient(client)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-slate-800"><span className="flex items-center gap-2 text-xs font-bold text-white"><UserRound className="h-4 w-4 text-blue-400" />{client.nome}</span><span className="text-[10px] text-slate-400">{client.whatsapp || 'Sem WhatsApp'}</span></button>) : <p className="px-2 py-3 text-center text-xs text-slate-500">Nenhum cliente encontrado.</p>}</div></div>}{form.cliente_id && <p className="mt-1.5 text-[11px] font-bold text-emerald-400">Cliente cadastrado selecionado — não será criado novamente.</p>}</div>
        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">WhatsApp<input value={form.cliente_whatsapp} onChange={event => setForm({ ...form, cliente_whatsapp: event.target.value })} className={`${inputClass} mt-1.5`} placeholder="(11) 99999-9999" /></label>
        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">Serviço<select value={form.servico_id} onChange={event => setForm({ ...form, servico_id: event.target.value })} className={`${inputClass} mt-1.5`} required><option value="">Selecione um serviço</option>{services.map(service => <option key={service.id} value={service.id}>{service.nome} — R$ {Number(service.preco || 0).toFixed(2)}</option>)}</select></label>
        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">Data e horário<input value={form.data_hora} onChange={event => setForm({ ...form, data_hora: event.target.value })} type="datetime-local" className={`${inputClass} mt-1.5`} required /></label>
        <textarea value={form.observacao} onChange={event => setForm({ ...form, observacao: event.target.value })} rows="3" className={inputClass} placeholder="Observações (opcional)" />
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-2xl px-4 py-3 text-xs font-bold text-slate-400">Cancelar</button><button className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-black text-white">Confirmar agendamento</button></div>
      </form>
    </div>
  </div>;
}
