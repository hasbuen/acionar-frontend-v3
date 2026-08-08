import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { ModalAlert, useModalAlert } from '../components/ModalAlert';
import { 
  Sparkles, 
  MessageSquare, 
  GitBranch, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  ArrowLeft, 
  Smartphone, 
  Play, 
  HelpCircle,
  Clock,
  Send,
  Loader2,
  Tag,
  ChevronRight
} from 'lucide-react';

const VARIABLE_TAGS = [
  { tag: '{cliente}', label: 'Nome do Cliente', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { tag: '{servico}', label: 'Nome do Serviço', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  { tag: '{data}', label: 'Data', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { tag: '{hora}', label: 'Horário', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { tag: '{profissional}', label: 'Profissional', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
  { tag: '{endereco}', label: 'Endereço', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
];

export function BotFlowBuilder({ onBack }) {
  const { alertState, showAlert, closeAlert } = useModalAlert();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [activeNodeId, setActiveNodeId] = useState(null);

  // Estados do Simulador de WhatsApp
  const [simMessages, setSimMessages] = useState([]);
  const [simInput, setSimInput] = useState('');
  const [simCurrentStep, setSimCurrentStep] = useState(0);

  // Carregar o fluxo atual do backend
  const fetchFlow = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/config/bot-flow');
      if (res.flow && res.flow.nodes) {
        setNodes(res.flow.nodes);
        if (res.flow.nodes.length > 0) {
          setActiveNodeId(res.flow.nodes[0].id);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar fluxo:', e);
      showAlert({
        title: 'Erro',
        message: 'Não foi possível carregar o fluxo do robô: ' + e.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlow();
  }, []);

  // Reiniciar Simulador
  useEffect(() => {
    resetSimulator();
  }, [nodes]);

  const resetSimulator = () => {
    const triggerNode = nodes.find(n => n.type === 'trigger');
    const msgNode = nodes.find(n => n.type === 'send_message');
    
    if (msgNode && msgNode.config?.text) {
      const formattedText = formatPreviewText(msgNode.config.text);
      setSimMessages([
        {
          id: 1,
          sender: 'bot',
          text: formattedText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setSimCurrentStep(1);
    } else {
      setSimMessages([]);
      setSimCurrentStep(0);
    }
  };

  const formatPreviewText = (text) => {
    if (!text) return '';
    return text
      .replace(/{cliente}/g, 'Ana Silva')
      .replace(/{servico}/g, 'Corte & Escova Premium')
      .replace(/{data}/g, '15/08/2026')
      .replace(/{hora}/g, '14:30')
      .replace(/{profissional}/g, 'Carla Ferreira')
      .replace(/{endereco}/g, 'Rua das Flores, 123');
  };

  const handleSimSend = (overrideInput = null) => {
    const input = overrideInput !== null ? overrideInput : simInput;
    if (!input.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSimMessages(prev => [...prev, newMsg]);
    setSimInput('');

    // Lógica do bot responder no simulador
    const optionsNode = nodes.find(n => n.type === 'options');
    const actionConfirmNode = nodes.find(n => n.config?.actionType === 'confirm_booking');
    const actionCancelNode = nodes.find(n => n.config?.actionType === 'cancel_booking');

    setTimeout(() => {
      let replyText = '';
      if (input.trim() === '1') {
        replyText = actionConfirmNode?.config?.responseText 
          || '✅ Agendamento Confirmado com sucesso! Te esperamos lá!';
      } else if (input.trim() === '2') {
        replyText = actionCancelNode?.config?.responseText 
          || '❌ Agendamento Cancelado. Esperamos te ver em breve!';
      } else {
        replyText = optionsNode?.config?.fallbackText 
          || 'Por favor, responda 1 para Confirmar ou 2 para Cancelar.';
      }

      setSimMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: formatPreviewText(replyText),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 600);
  };

  // Salvar Fluxo no Backend
  const handleSaveFlow = async () => {
    setSaving(true);
    try {
      await apiRequest('/config/bot-flow', 'PUT', { flow: { nodes } });
      showAlert({
        title: 'Fluxo Salvo com Sucesso! 🚀',
        message: 'O novo fluxo do robô WhatsApp foi publicado e já está ativo para todas as novas solicitações.',
        type: 'success',
      });
    } catch (e) {
      showAlert({
        title: 'Erro ao Salvar',
        message: 'Ocorreu um erro ao salvar o fluxo: ' + e.message,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Atualizar campo de um Nó específico
  const updateNodeConfig = (nodeId, key, value) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          config: {
            ...n.config,
            [key]: value
          }
        };
      }
      return n;
    }));
  };

  // Inserir tag de variável no cursor do nó ativo
  const insertVariable = (tag) => {
    if (!activeNodeId) return;
    const currentNode = nodes.find(n => n.id === activeNodeId);
    if (!currentNode) return;

    if (currentNode.type === 'send_message') {
      const currentText = currentNode.config.text || '';
      updateNodeConfig(activeNodeId, 'text', currentText + ' ' + tag);
    } else if (currentNode.type === 'action') {
      const currentText = currentNode.config.responseText || '';
      updateNodeConfig(activeNodeId, 'responseText', currentText + ' ' + tag);
    } else if (currentNode.type === 'options') {
      const currentText = currentNode.config.fallbackText || '';
      updateNodeConfig(activeNodeId, 'fallbackText', currentText + ' ' + tag);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-300">Carregando Construtor ApexChat...</p>
      </div>
    );
  }

  const activeNode = nodes.find(n => n.id === activeNodeId);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans">
      <ModalAlert open={alertState.open} onClose={closeAlert} {...alertState} />

      {/* Header Topbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              title="Voltar para Configurações"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                ApexChat Flow Builder
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  N8N Engine
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Construção visual e personalização do robô interativo de WhatsApp</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFlow}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Resetar
          </button>
          <button
            onClick={handleSaveFlow}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Publicar Fluxo
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left/Center Panel: Visual Flow Tree Builder */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Quick Variable Insertion Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">Variáveis Dinâmicas Rápidas</h2>
              <span className="text-[10px] text-slate-500">(Clique em uma tag para inserir no nó selecionado)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {VARIABLE_TAGS.map(v => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => insertVariable(v.tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${v.color}`}
                >
                  {v.label} <code className="ml-1 opacity-70 font-mono text-[10px]">{v.tag}</code>
                </button>
              ))}
            </div>
          </div>

          {/* Node Stream */}
          <div className="space-y-4 relative">
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-500 via-blue-500 to-purple-500 opacity-30 z-0" />

            {nodes.map((node, index) => {
              const isSelected = activeNodeId === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setActiveNodeId(node.id)}
                  className={`
                    relative z-10 p-5 rounded-2xl border transition-all cursor-pointer shadow-lg
                    ${isSelected 
                      ? 'bg-slate-900 border-emerald-500/80 ring-2 ring-emerald-500/20' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'}
                  `}
                >
                  {/* Node Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`
                        h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md
                        ${node.type === 'trigger' ? 'bg-gradient-to-tr from-amber-500 to-orange-500' : ''}
                        ${node.type === 'send_message' ? 'bg-gradient-to-tr from-blue-600 to-indigo-600' : ''}
                        ${node.type === 'options' ? 'bg-gradient-to-tr from-purple-600 to-pink-600' : ''}
                        ${node.type === 'action' ? (node.config?.actionType === 'confirm_booking' ? 'bg-gradient-to-tr from-emerald-600 to-teal-600' : 'bg-gradient-to-tr from-rose-600 to-red-600') : ''}
                      `}>
                        {node.type === 'trigger' && <Sparkles className="h-5 w-5" />}
                        {node.type === 'send_message' && <MessageSquare className="h-5 w-5" />}
                        {node.type === 'options' && <GitBranch className="h-5 w-5" />}
                        {node.type === 'action' && (node.config?.actionType === 'confirm_booking' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                            Passo {index + 1}
                          </span>
                          <h3 className="text-sm font-black text-white">{node.title}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {node.type === 'trigger' && 'Gatilho Inicial'}
                          {node.type === 'send_message' && 'Envio de Mensagem'}
                          {node.type === 'options' && 'Aguardando Resposta do Cliente (1 ou 2)'}
                          {node.type === 'action' && `Ação do Sistema: ${node.config?.actionType}`}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className={`h-5 w-5 transition-transform ${isSelected ? 'rotate-90 text-emerald-400' : 'text-slate-600'}`} />
                  </div>

                  {/* Node Edit Body */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4 animate-fade-in">
                      {node.type === 'send_message' && (
                        <div>
                          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                            Texto da Mensagem Enviada ao Cliente
                          </label>
                          <textarea
                            rows={4}
                            value={node.config?.text || ''}
                            onChange={(e) => updateNodeConfig(node.id, 'text', e.target.value)}
                            className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500 transition-all leading-relaxed"
                            placeholder="Digite a mensagem do bot..."
                          />
                        </div>
                      )}

                      {node.type === 'options' && (
                        <div className="space-y-3">
                          <label className="block text-xs font-black uppercase text-slate-400">
                            Mensagem de Erro / Resposta Inválida (Fallback)
                          </label>
                          <input
                            type="text"
                            value={node.config?.fallbackText || ''}
                            onChange={(e) => updateNodeConfig(node.id, 'fallbackText', e.target.value)}
                            className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
                            placeholder="Ex: Não entendi. Digite 1 ou 2."
                          />
                        </div>
                      )}

                      {node.type === 'action' && (
                        <div>
                          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                            Mensagem Final Enviada após a Ação ({node.config?.actionType})
                          </label>
                          <textarea
                            rows={3}
                            value={node.config?.responseText || ''}
                            onChange={(e) => updateNodeConfig(node.id, 'responseText', e.target.value)}
                            className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500 transition-all leading-relaxed"
                            placeholder="Digite a resposta do bot..."
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: WhatsApp Real-Time Live Simulator */}
        <div className="w-[380px] bg-slate-900/90 border-l border-slate-800 flex flex-col hidden lg:flex">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">Simulador WhatsApp</h2>
            </div>
            <button
              onClick={resetSimulator}
              className="text-[11px] font-bold text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reiniciar Chat
            </button>
          </div>

          {/* Smartphone Frame Container */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col justify-center items-center bg-slate-950/40">
            <div className="w-full h-full max-h-[580px] bg-[#0b141a] rounded-[2rem] border-4 border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
              {/* WhatsApp Header */}
              <div className="px-4 py-3 bg-[#202c33] flex items-center gap-3 border-b border-slate-800/60">
                <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                  A
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white leading-tight">Bot do Estabelecimento</h3>
                  <p className="text-[10px] text-emerald-400">online no WhatsApp</p>
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#0b141a] bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
                {simMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[85%] ${m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div className={`
                      p-3 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-sm
                      ${m.sender === 'user' 
                        ? 'bg-[#005c4b] text-slate-100 rounded-tr-none' 
                        : 'bg-[#202c33] text-slate-200 rounded-tl-none'}
                    `}>
                      {m.text}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 px-1">{m.time}</span>
                  </div>
                ))}
              </div>

              {/* Quick Action Test Buttons */}
              <div className="px-3 py-2 bg-[#111b21] border-t border-slate-800/40 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSimSend('1')}
                  className="flex-1 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 transition-all text-center"
                >
                  Testar "1" (Confirmar)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimSend('2')}
                  className="flex-1 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-[11px] font-bold border border-rose-500/30 transition-all text-center"
                >
                  Testar "2" (Cancelar)
                </button>
              </div>

              {/* Chat Input Bar */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSimSend(); }}
                className="p-2 bg-[#202c33] flex items-center gap-2 border-t border-slate-800/80"
              >
                <input
                  type="text"
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  placeholder="Digite '1' ou '2'..."
                  className="flex-1 px-3 py-2 bg-[#2a3942] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
