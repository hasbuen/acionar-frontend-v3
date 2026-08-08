import React, { useState, useEffect } from 'react';
import { X, BookOpen, Headphones, ShieldCheck, Clock, RefreshCw, ChevronRight, FileText } from 'lucide-react';
import { apiRequest } from '../services/api';
import { SupportModal } from './SupportModal';
import { SupportDemandsModal } from './SupportDemandsModal';

export function HelpCenterModal({ isOpen, onClose, showAlert }) {
  const [history, setHistory] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showDemandsModal, setShowDemandsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('auditoria'); // 'auditoria' | 'faqs'

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await apiRequest('/audit');
      if (res && Array.isArray(res.logs)) {
        setHistory(res.logs);
      }
    } catch (err) {
      console.warn('Erro ao carregar auditoria:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAuditLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-950/40 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
        <div className="w-full max-w-lg max-h-[88dvh] overflow-y-auto scroll-y-touch pb-safe-bottom rounded-t-[2.2rem] sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 space-y-5">
          
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                CENTRAL DE AJUDA & AUDITORIA
              </span>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Como podemos ajudar?
              </h2>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Botões de Ação de Suporte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="flex items-center gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-3.5 text-left hover:bg-violet-500/20 transition group shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black shadow-md">
                <Headphones className="h-5 w-5" />
              </span>
              <div>
                <strong className="block text-xs font-black text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  Acionar Suporte
                </strong>
                <small className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Enviar ticket com anexo
                </small>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowDemandsModal(true)}
              className="flex items-center gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-left hover:bg-blue-500/20 transition group shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white font-black shadow-md">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <strong className="block text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Demandas de Suporte
                </strong>
                <small className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Acompanhar chamados
                </small>
              </div>
            </button>
          </div>

          {/* Abas Alternadoras: Auditoria | FAQs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('auditoria')}
              className={`pb-2.5 text-xs font-black border-b-2 transition-all ${
                activeTab === 'auditoria'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              📊 Auditoria de Operações
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('faqs')}
              className={`pb-2.5 text-xs font-black border-b-2 transition-all ${
                activeTab === 'faqs'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              ❓ Dúvidas & FAQs
            </button>
          </div>

          {/* Conteúdo Aba Auditoria */}
          {activeTab === 'auditoria' && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Histórico de Ações do Tenant
                  </h3>
                  <p className="text-[11px] text-slate-400">Logs consolidados em tempo real.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchAuditLogs}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-500 transition"
                  title="Atualizar Logs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto scroll-y-touch pr-1">
                {loadingAudit ? (
                  <p className="text-center py-6 text-xs text-slate-400 font-bold">Carregando auditoria...</p>
                ) : history.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400 font-bold">Nenhum evento registrado ainda.</p>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {item.acao}
                        </span>
                        <time className="text-[10px] font-bold text-slate-400">{item.data}</time>
                      </div>
                      <p className="text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">
                        {item.detalhes}
                      </p>
                      <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Mapeamento: {item.entidade}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Conteúdo Aba FAQs */}
          {activeTab === 'faqs' && (
            <div className="space-y-3 max-h-64 overflow-y-auto scroll-y-touch pr-1 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <h4 className="font-black text-slate-900 dark:text-white">Como conectar o WhatsApp do estabelecimento?</h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Acesse <strong>Configurações &gt; Robô do WhatsApp</strong>, clique em "Gerar QR Code de Conexão" e leia com seu aparelho no WhatsApp.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <h4 className="font-black text-slate-900 dark:text-white">Como alterar as cores e logotipo da agenda pública?</h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Vá em <strong>Configurações &gt; Perfil & Agenda Pública</strong> para alterar o logotipo, nome da empresa e slug.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modais de Suporte */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        showAlert={showAlert}
      />

      <SupportDemandsModal
        isOpen={showDemandsModal}
        onClose={() => setShowDemandsModal(false)}
        showAlert={showAlert}
      />
    </>
  );
}
