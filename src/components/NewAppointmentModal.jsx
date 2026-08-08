import React, { useState } from 'react';
import { Calendar, Search, UserRound, X, Smartphone } from 'lucide-react';
import { PremiumSelect } from './PremiumSelect';

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:border-blue-500';

export function NewAppointmentModal({ form, setForm, clients, services, onClose, onSubmit, showAlert }) {
  const [finderOpen, setFinderOpen] = useState(false);
  const [search, setSearch] = useState('');
  const matches = clients.filter(client => (client.nome || '').toLowerCase().includes(search.toLowerCase()) || (client.whatsapp || '').includes(search)).slice(0, 8);

  const contactsSupported = typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;

  const handleImportContact = async () => {
    if (!contactsSupported) {
      if (showAlert) {
        showAlert({ type: 'info', title: 'Recurso não suportado', message: 'Para buscar contatos direto da lista do seu telefone, abra este aplicativo no navegador do seu celular (Android Chrome ou iOS Safari)!' });
      }
      return;
    }
    try {
      const props = ['name', 'tel'];
      const opts = { multiple: false };
      const contacts = await navigator.contacts.select(props, opts);
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        const rawName = contact.name && contact.name[0] ? contact.name[0] : '';
        const rawPhone = contact.tel && contact.tel[0] ? contact.tel[0] : '';
        const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^55/, '');
        setForm({
          ...form,
          cliente_nome: rawName,
          cliente_whatsapp: cleanPhone,
          cliente_id: ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectClient = client => {
    setForm({ ...form, cliente_id: client.id, cliente_nome: client.nome, cliente_whatsapp: client.whatsapp || '' });
    setFinderOpen(false);
    setSearch('');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/15 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 sm:p-8">
        <div className="mb-5 flex items-start justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-600 dark:text-blue-300">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-950 dark:text-white leading-tight">Novo Agendamento</h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">Encontre um cliente ou cadastre um novo</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Cliente</label>
              <div className="flex gap-1.5">
                <button type="button" onClick={handleImportContact} className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/25 bg-purple-500/10 px-2.5 py-1.5 text-[10px] font-black text-purple-600 dark:text-purple-300 hover:bg-purple-500/20">
                  <Smartphone className="h-3.5 w-3.5" />
                  Importar Agenda
                </button>
                <button type="button" onClick={() => setFinderOpen(!finderOpen)} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/25 bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-black text-blue-600 dark:text-blue-300 hover:bg-blue-500/20">
                  <Search className="h-3.5 w-3.5" />
                  {finderOpen ? 'Digitar nome' : 'Buscar cadastrado'}
                </button>
              </div>
            </div>
            <input value={form.cliente_nome} onChange={event => setForm({ ...form, cliente_nome: event.target.value, cliente_id: '' })} className={inputClass} placeholder="Nome do cliente" required />

            
            {finderOpen && (
              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950 p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input autoFocus value={search} onChange={event => setSearch(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500" placeholder="Buscar por nome ou WhatsApp" />
                </div>
                <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                  {matches.length ? matches.map(client => (
                    <button type="button" key={client.id} onClick={() => selectClient(client)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                        <UserRound className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        {client.nome}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{client.whatsapp || 'Sem WhatsApp'}</span>
                    </button>
                  )) : (
                    <p className="px-2 py-3 text-center text-xs font-medium text-slate-500">Nenhum cliente encontrado.</p>
                  )}
                </div>
              </div>
            )}
            
            {form.cliente_id && (
              <p className="mt-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Cliente cadastrado selecionado — não será criado novamente.</p>
            )}
          </div>
          
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            WhatsApp
            <input value={form.cliente_whatsapp} onChange={event => setForm({ ...form, cliente_whatsapp: event.target.value })} className={`${inputClass} mt-1.5`} placeholder="(11) 99999-9999" />
          </label>
          
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Serviço
            <PremiumSelect value={form.servico_id} onChange={event => setForm({ ...form, servico_id: event.target.value })} className="mt-1.5" required>
              <option value="">Selecione um serviço</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>{service.nome} — R$ {Number(service.preco || 0).toFixed(2)}</option>
              ))}
            </PremiumSelect>
          </label>
          
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Data e horário
            <input value={form.data_hora} onChange={event => setForm({ ...form, data_hora: event.target.value })} type="datetime-local" className={`${inputClass} mt-1.5`} required />
          </label>
          
          <textarea value={form.observacao} onChange={event => setForm({ ...form, observacao: event.target.value })} rows="3" className={inputClass} placeholder="Observações (opcional)" />
          
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="rounded-2xl px-5 py-3 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Cancelar</button>
            <button className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-xs font-black text-white shadow-lg shadow-blue-500/20">Confirmar agendamento</button>
          </div>
        </form>
      </div>
    </div>
  );
}
