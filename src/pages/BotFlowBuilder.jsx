import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { ModalAlert, useModalAlert } from '../components/ModalAlert';
import { HelpBadge } from '../components/HelpBadge';
import { 
  Sparkles, 
  MessageSquare, 
  GitBranch, 
  CheckCircle2, 
  XCircle, 
  Save, 
  RotateCcw, 
  ArrowLeft, 
  Smartphone, 
  Send, 
  Loader2, 
  Tag, 
  ChevronRight 
} from 'lucide-react';

const VARIABLE_TAGS = [
  { tag: '{cliente}', label: 'Cliente', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { tag: '{cliente_telefone}', label: 'Tel. Cliente', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
  { tag: '{servico}', label: 'Serviço', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  { tag: '{data}', label: 'Data', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { tag: '{hora}', label: 'Horário', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { tag: '{tipo_atendimento}', label: 'Tipo (Salão/Domicílio)', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
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
    
    const messages = [];
    if (triggerNode) {
      const triggerText = triggerNode.config?.text || triggerNode.config?.alertMessage || '🚨 *Novo Agendamento Solicitado na Agenda Pública!*\n\n👤 *Cliente:* Ana Silva\n📱 *Contato:* (45) 99999-8888\n💈 *Serviço:* Corte & Escova\n📅 *Data:* 15/08/2026 às 14:30\n🏠 *Tipo:* Atendimento no Salão\n\n*Acesse o app Acionar para Aceitar ou Recusar.*';
      messages.push({
        id: 1,
        sender: 'bot',
        text: formatPreviewText(triggerText),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    if (msgNode && msgNode.config?.text) {
      messages.push({
        id: 2,
        sender: 'bot',
        text: formatPreviewText(msgNode.config.text),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    setSimMessages(messages);
  };

  const formatPreviewText = (text) => {
    if (!text) return '';
    return text
      .replace(/{cliente}/g, 'Ana Silva')
      .replace(/{cliente_nome}/g, 'Ana Silva')
      .replace(/{cliente_telefone}/g, '(45) 99999-8888')
      .replace(/{servico}/g, 'Corte & Escova')
      .replace(/{data}/g, '15/08/2026')
      .replace(/{hora}/g, '14:30')
      .replace(/{horario}/g, '14:30')
      .replace(/{tipo_atendimento}/g, 'Atendimento no Salão 💈')
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

    const optionsNode = nodes.find(n => n.type === 'options');
    const actionConfirmNode = nodes.find(n => n.config?.actionType === 'confirm_booking');
    const actionCancelNode = nodes.find(n => n.config?.actionType === 'cancel_booking');

    setTimeout(() => {
      let replyText = '';
      if (input.trim() === '1') {
        replyText = actionConfirmNode?.config?.responseText 
          || '✅ Agendamento Confirmado com sucesso!';
      } else if (input.trim() === '2') {
        replyText = actionCancelNode?.config?.responseText 
          || '❌ Agendamento Cancelado.';
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
        title: 'Salvo com Sucesso! 🚀',
        message: 'O novo fluxo do robô foi atualizado para todos os atendimentos.',
        type: 'success',
      });
    } catch (e) {
      showAlert({
        title: 'Erro ao Salvar',
        message: 'Ocorreu um erro ao salvar: ' + e.message,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

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

  const insertVariable = (tag) => {
    if (!activeNodeId) return;
    const currentNode = nodes.find(n => n.id === activeNodeId);
    if (!currentNode) return;

    if (currentNode.type === 'trigger') {
      const currentText = currentNode.config?.text || currentNode.config?.alertMessage || '';
      updateNodeConfig(activeNodeId, 'text', (currentText + ' ' + tag).trim());
      updateNodeConfig(activeNodeId, 'alertMessage', (currentText + ' ' + tag).trim());
    } else if (currentNode.type === 'send_message') {
      const currentText = currentNode.config.text || '';
      updateNodeConfig(activeNodeId, 'text', (currentText + ' ' + tag).trim());
    } else if (currentNode.type === 'action') {
      const currentText = currentNode.config.responseText || '';
      updateNodeConfig(activeNodeId, 'responseText', (currentText + ' ' + tag).trim());
    } else if (currentNode.type === 'options') {
      const currentText = currentNode.config.fallbackText || '';
      updateNodeConfig(activeNodeId, 'fallbackText', (currentText + ' ' + tag).trim());
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-400">Carregando Robô do WhatsApp...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans">
      <ModalAlert open={alertState.open} onClose={closeAlert} {...alertState} />

      {/* Header Topbar Ultra Limpo & Responsivo */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              title="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black text-white tracking-tight">Robô do WhatsApp</h1>
            <HelpBadge
              title="Robô do WhatsApp"
              description="Nesta tela você personaliza as mensagens automáticas enviadas para os profissionais quando um cliente faz agendamento e para os clientes quando a confirmação for aceita."
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFlow}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Resetar para as mensagens originais"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Resetar</span>
          </button>
          <button
            onClick={handleSaveFlow}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>Salvar</span>
          </button>
        </div>
      </header>

      {/* Layout de Edição */}
      <div className="flex-1 flex overflow-hidden">
        {/* Painel Esquerdo: Sequência de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Tags de Variáveis Dinâmicas */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-black uppercase text-slate-300">Variáveis de Texto</span>
              </div>
              <HelpBadge
                title="Variáveis Dinâmicas"
                description="Clique em qualquer um dos botões abaixo para inserir dados automáticos do cliente (como Nome, Serviço, Data, Horário e Endereço) diretamente dentro da mensagem do robô."
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLE_TAGS.map(v => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => insertVariable(v.tag)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${v.color}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Passos da Sequência */}
          <div className="space-y-3.5 relative">
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-500 via-blue-500 to-purple-500 opacity-20 z-0" />

            {nodes.map((node, index) => {
              const isSelected = activeNodeId === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setActiveNodeId(node.id)}
                  className={`
                    relative z-10 p-4 rounded-2xl border transition-all cursor-pointer shadow-md
                    ${isSelected 
                      ? 'bg-slate-900 border-emerald-500/80 ring-2 ring-emerald-500/20' 
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'}
                  `}
                >
                  {/* Cabeçalho do Passo */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        h-9 w-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0
                        ${node.type === 'trigger' ? 'bg-amber-500' : ''}
                        ${node.type === 'send_message' ? 'bg-blue-600' : ''}
                        ${node.type === 'options' ? 'bg-purple-600' : ''}
                        ${node.type === 'action' ? (node.config?.actionType === 'confirm_booking' ? 'bg-emerald-600' : 'bg-rose-600') : ''}
                      `}>
                        {node.type === 'trigger' && <Sparkles className="h-4 w-4" />}
                        {node.type === 'send_message' && <MessageSquare className="h-4 w-4" />}
                        {node.type === 'options' && <GitBranch className="h-4 w-4" />}
                        {node.type === 'action' && (node.config?.actionType === 'confirm_booking' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                            Passo {index + 1}
                          </span>
                          <h3 className="text-xs font-black text-white">{node.title}</h3>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? 'rotate-90 text-emerald-400' : 'text-slate-600'}`} />
                  </div>

                  {/* Edição do Passo Selecionado */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3 animate-fade-in">
                      {node.type === 'trigger' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-black uppercase tracking-wider text-amber-400">
                              Mensagem de Alerta no WhatsApp da Equipe
                            </label>
                            <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                              Exclusivo da Equipe
                            </span>
                          </div>
                          <textarea
                            rows={5}
                            value={node.config?.text || node.config?.alertMessage || ''}
                            onChange={(e) => {
                              updateNodeConfig(node.id, 'text', e.target.value);
                              updateNodeConfig(node.id, 'alertMessage', e.target.value);
                            }}
                            className="w-full p-3 bg-slate-950 rounded-xl border border-amber-500/30 text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500 transition-all leading-relaxed"
                            placeholder="🚨 *Novo Agendamento Solicitado!* Cliente: {cliente}, Serviço: {servico}, Data: {data} às {hora}..."
                          />
                          <p className="text-[10px] text-slate-400 leading-normal">
                            Esta mensagem é enviada diretamente no WhatsApp dos profissionais quando um cliente solicita um agendamento na página pública.
                          </p>
                        </div>
                      )}

                      {node.type === 'send_message' && (
                        <div>
                          <label className="block text-[11px] font-black uppercase tracking-wider text-blue-400 mb-1">
                            Mensagem Inicial para o Cliente (Confirmação do Aceite)
                          </label>
                          <textarea
                            rows={4}
                            value={node.config?.text || ''}
                            onChange={(e) => updateNodeConfig(node.id, 'text', e.target.value)}
                            className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 transition-all leading-relaxed"
                            placeholder="Digite a mensagem enviada ao cliente quando você aceitar..."
                          />
                        </div>
                      )}

                      {node.type === 'options' && (
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                            Resposta para opção inválida
                          </label>
                          <input
                            type="text"
                            value={node.config?.fallbackText || ''}
                            onChange={(e) => updateNodeConfig(node.id, 'fallbackText', e.target.value)}
                            className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
                            placeholder="Ex: Não entendi. Digite 1 ou 2."
                          />
                        </div>
                      )}

                      {node.type === 'action' && (
                        <div>
                          <textarea
                            rows={3}
                            value={node.config?.responseText || ''}
                            onChange={(e) => updateNodeConfig(node.id, 'responseText', e.target.value)}
                            className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500 transition-all leading-relaxed"
                            placeholder="Digite a resposta após o clique..."
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

        {/* Painel Direito: Simulador de WhatsApp */}
        <div className="w-[360px] bg-slate-900/90 border-l border-slate-800 flex flex-col hidden lg:flex">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-black text-slate-200">Simulador de WhatsApp</span>
            </div>
            <button
              onClick={resetSimulator}
              className="text-[11px] font-bold text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Reiniciar
            </button>
          </div>

          <div className="flex-1 p-3 overflow-hidden flex flex-col justify-center items-center bg-slate-950/40">
            <div className="w-full h-full max-h-[560px] bg-[#0b141a] rounded-[2rem] border-4 border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
              <div className="px-4 py-2.5 bg-[#202c33] flex items-center gap-2.5 border-b border-slate-800/60">
                <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-[11px]">
                  R
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">Robô Acionar</h4>
                  <p className="text-[9px] text-emerald-400">online</p>
                </div>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-[#0b141a]">
                {simMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[85%] ${m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div className={`
                      p-2.5 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-sm
                      ${m.sender === 'user' 
                        ? 'bg-[#005c4b] text-slate-100 rounded-tr-none' 
                        : 'bg-[#202c33] text-slate-200 rounded-tl-none'}
                    `}>
                      {m.text}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-0.5 px-1">{m.time}</span>
                  </div>
                ))}
              </div>

              <div className="px-2.5 py-1.5 bg-[#111b21] border-t border-slate-800/40 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSimSend('1')}
                  className="flex-1 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 transition-all text-center"
                >
                  Testar "1" (Confirmar)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimSend('2')}
                  className="flex-1 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-[10px] font-bold border border-rose-500/30 transition-all text-center"
                >
                  Testar "2" (Cancelar)
                </button>
              </div>

              <form 
                onSubmit={(e) => { e.preventDefault(); handleSimSend(); }}
                className="p-2 bg-[#202c33] flex items-center gap-1.5 border-t border-slate-800/80"
              >
                <input
                  type="text"
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  placeholder="Digite 1 ou 2..."
                  className="flex-1 px-3 py-1.5 bg-[#2a3942] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
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
