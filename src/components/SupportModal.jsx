import React, { useState, useRef } from 'react';
import { X, Headphones, Send, Upload, Loader2, CheckCircle2, Paperclip, AlertCircle } from 'lucide-react';
import { apiRequest } from '../services/api';

export function SupportModal({ isOpen, onClose, showAlert }) {
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [anexoBase64, setAnexoBase64] = useState(null);
  const [anexoNome, setAnexoNome] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (showAlert) showAlert({ type: 'warning', title: 'Arquivo muito grande', message: 'O anexo deve ter no máximo 5MB.' });
      return;
    }

    setAnexoNome(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAnexoBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assunto.trim() || !mensagem.trim()) {
      if (showAlert) showAlert({ type: 'warning', title: 'Campos obrigatórios', message: 'Preencha o assunto e a mensagem.' });
      return;
    }

    setSending(true);
    try {
      await apiRequest('/suporte', 'POST', {
        assunto,
        mensagem,
        anexo_base64: anexoBase64,
        anexo_nome: anexoNome,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAssunto('');
        setMensagem('');
        setAnexoBase64(null);
        setAnexoNome('');
        onClose();
      }, 2200);
    } catch (err) {
      if (showAlert) showAlert({ type: 'error', title: 'Erro ao Enviar', message: err.message || 'Não foi possível enviar o suporte.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg max-h-[88dvh] overflow-y-auto scroll-y-touch pb-safe-bottom rounded-t-[2.2rem] sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xl space-y-5 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black shadow-lg shadow-violet-500/20">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">
                SUPORTE ESPECIALIZADO
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                Acionar Suporte
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Solicitação Enviada!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              Sua mensagem e anexo foram disparados diretamente para <strong>julio.cesar.ovidio.bueno@gmail.com</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Assunto *
              </label>
              <input
                type="text"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Ex: Dúvida sobre integração do WhatsApp"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-violet-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Mensagem *
              </label>
              <textarea
                rows={4}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Descreva detalhadamente o que você precisa ou qual dúvida encontrou..."
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-violet-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 leading-relaxed resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Anexo Opcional (Print ou Documento)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                  <Paperclip className="h-4 w-4 text-violet-500 shrink-0" />
                  <span className="truncate">{anexoNome || 'Clique para escolher um anexo (Imagem/PDF max 5MB)'}</span>
                </div>
                {anexoNome && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    Anexado
                  </span>
                )}
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-black text-white shadow-lg shadow-violet-500/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>{sending ? 'Enviando...' : 'Confirmar e Enviar'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
