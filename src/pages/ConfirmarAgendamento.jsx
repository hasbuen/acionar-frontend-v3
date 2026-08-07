import React, { useEffect, useState } from 'react';

/**
 * ConfirmarAgendamento — Página intermediária aberta pelo Service Worker
 * quando o usuário clica em "✅ Confirmar & WhatsApp" na notificação push.
 *
 * Fluxo:
 * 1. Extrai parâmetros da URL (slug, id, phone, nome, servico, dataHora)
 * 2. Chama POST /api/public/tenant/:slug/agendamentos/:id/confirmar-rapido
 * 3. Recebe o template de mensagem das configurações do tenant
 * 4. Formata e redireciona para wa.me com a mensagem
 */
export function ConfirmarAgendamento() {
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    const id = params.get('id');
    const phone = params.get('phone') || '';
    const nome = params.get('nome') || 'Cliente';
    const servico = params.get('servico') || 'Serviço';
    const dataHora = params.get('dataHora') || '';

    if (!slug || !id) {
      setStatus('error');
      setErrorMsg('Parâmetros inválidos.');
      return;
    }

    const confirmar = async () => {
      try {
        // 1. Chamar o backend para confirmar o agendamento + cadastrar cliente
        const confirmUrl = `/api/public/tenant/${slug}/agendamentos/${id}/confirmar-rapido?cliente_nome=${encodeURIComponent(nome)}&whatsapp=${encodeURIComponent(phone)}`;
        const res = await fetch(confirmUrl, { method: 'POST' });
        const data = await res.json();

        if (!data.ok) {
          throw new Error(data.message || 'Erro ao confirmar agendamento.');
        }

        setStatus('success');

        // 2. Construir a mensagem do WhatsApp usando o template das configurações
        const msgConfig = data.messageConfig;
        const clienteNome = data.clienteNome || nome;
        const servicoNome = data.servicoNome || servico;
        const whatsappPhone = data.whatsappPhone || phone;

        // Formatar data/hora
        let dataFormatada = dataHora;
        let horaFormatada = '';
        if (data.agendamento?.data_hora) {
          const dt = new Date(data.agendamento.data_hora);
          dataFormatada = dt.toLocaleDateString('pt-BR');
          horaFormatada = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else if (dataHora) {
          // Tentar parsear a string
          try {
            const parts = dataHora.split(' às ');
            if (parts.length === 2) {
              dataFormatada = parts[0];
              horaFormatada = parts[1];
            }
          } catch(e) {}
        }

        // Usar template_confirmacao das configurações, com fallback
        const endereco = msgConfig?.endereco || '';
        let template = msgConfig?.template_confirmacao || 
          `Olá, *{cliente}*! 👋\n\nSeu agendamento de *{servico}* para o dia *{data}* às *{hora}* foi *CONFIRMADO* com sucesso! ✅\n\n📍 *Endereço*: {endereco}\n\nAgradecemos a preferência e aguardamos você! 😊`;

        const msgText = template
          .replace(/{cliente}/g, clienteNome)
          .replace(/{servico}/g, servicoNome)
          .replace(/{data}/g, dataFormatada)
          .replace(/{hora}/g, horaFormatada)
          .replace(/{endereco}/g, endereco);

        // 3. Redirecionar para o WhatsApp
        const cleanNum = whatsappPhone ? String(whatsappPhone).replace(/\D/g, '') : '';
        if (cleanNum) {
          const phoneWithCountry = cleanNum.startsWith('55') ? cleanNum : `55${cleanNum}`;
          const waUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msgText)}`;
          
          // Pequeno delay para o usuário ver a confirmação
          setTimeout(() => {
            window.location.href = waUrl;
          }, 800);
        }
      } catch (err) {
        console.error('[CONFIRMAR AGENDAMENTO ERROR]', err);
        setStatus('error');
        setErrorMsg(err.message || 'Erro ao confirmar agendamento.');
        
        // Mesmo com erro, redirecionar para a agenda após 3s
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    confirmar();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #020617, #0f172a)',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%',
        background: 'rgba(30, 41, 59, 0.8)',
        borderRadius: '24px',
        padding: '40px 30px',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}>
        {status === 'loading' && (
          <>
            <div style={{
              width: '56px',
              height: '56px',
              border: '4px solid rgba(59, 130, 246, 0.3)',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px',
            }} />
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Confirmando agendamento...
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              Abrindo WhatsApp em seguida
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              fontSize: '56px',
              marginBottom: '16px',
              animation: 'fadeInUp 0.4s ease-out',
            }}>✅</div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#4ade80' }}>
              Agendamento Confirmado!
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              Redirecionando para o WhatsApp...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              fontSize: '56px',
              marginBottom: '16px',
            }}>⚠️</div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#f87171' }}>
              Erro
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              {errorMsg}
            </p>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px' }}>
              Redirecionando para a agenda...
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
