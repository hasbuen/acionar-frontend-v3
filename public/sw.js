// Service Worker do painel Acionar: Web Push para Android e iOS instalado como PWA.

const CACHE_NAME = 'acionar-v3-cache-v1';
const DEFAULT_URL = new URL('/', self.registration.scope).href;
const DEFAULT_ICON = new URL('/icon-192.png', self.registration.scope).href;
const DEFAULT_BADGE = new URL('/icon-192.png', self.registration.scope).href;

function normalizeNotificationPayload(raw = {}) {
    const nestedData = raw.data && typeof raw.data === 'object' ? raw.data : {};
    const appointmentId = raw.agendamento_id || raw.agendamentoId ||
        nestedData.agendamento_id || nestedData.agendamentoId || null;
    const clienteNome = nestedData.clienteNome || raw.clienteNome || 'Cliente';
    const telefone = nestedData.telefone || raw.telefone || 'Não informado';
    const servicoNome = nestedData.servicoNome || raw.servicoNome || 'Serviço';
    const dataLabel = nestedData.data || raw.dataLabel || '';
    const hora = nestedData.hora || raw.hora || '';
    const local = nestedData.local || raw.local || '';
    const observacoes = nestedData.observacoes || raw.observacoes || '';
    const requestedUrl = raw.url || nestedData.url || DEFAULT_URL;
    const notificationUrl = new URL(requestedUrl, self.registration.scope).href;

    const body = raw.body || [
        `WhatsApp: ${telefone}`,
        `Serviço: ${servicoNome}`,
        dataLabel || hora ? `Data: ${dataLabel}${hora ? ` às ${hora}` : ''}` : '',
        local ? `Local: ${local}` : '',
        observacoes ? `Obs: ${observacoes}` : ''
    ].filter(Boolean).join('\n');

    return {
        title: raw.title || `Novo agendamento: ${clienteNome}`,
        options: {
            body,
            icon: raw.icon || DEFAULT_ICON,
            badge: raw.badge || DEFAULT_BADGE,
            vibrate: raw.vibrate || [300, 100, 300, 100, 300],
            sound: 'default',
            tag: raw.tag || (appointmentId ? `agendamento-${appointmentId}` : 'novo-agendamento'),
            renotify: raw.renotify !== false,
            requireInteraction: raw.requireInteraction !== false,
            data: {
                ...nestedData,
                url: notificationUrl,
                agendamento_id: appointmentId
            },
            actions: raw.actions || [
                { action: 'confirm_whatsapp', title: '✅ Confirmar & WhatsApp' },
                { action: 'open_agenda', title: '📅 Ver na Agenda' }
            ]
        }
    };
}

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Pass-through fetch with network-first strategy
  if (e.request.method !== 'GET' || e.request.url.includes('/api/')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

self.addEventListener('message', (event) => {
    if (event.data?.type !== 'SHOW_NOTIFICATION') return;
    const { title, options } = normalizeNotificationPayload(event.data);
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('push', (event) => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch (error) {
        payload = { body: event.data ? event.data.text() : '' };
    }

    const { title, options } = normalizeNotificationPayload(payload);
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const action = event.action;
    const data = event.notification.data || {};
    const confirmUrl = data.confirmUrl;
    const whatsapp = data.whatsapp;
    const clienteNome = data.clienteNome || 'Cliente';
    const servicoNome = data.servicoNome || 'Serviço';
    const dataHoraFormatted = data.dataHoraFormatted || '';
    const targetUrl = new URL(data.url || DEFAULT_URL, self.registration.scope);

    // Identificar se é confirmação + WhatsApp (botão confirm_whatsapp OU clique no corpo da notificação quando possui WhatsApp)
    const isConfirmAction = action === 'confirm_whatsapp' || (whatsapp && action !== 'open_agenda');

    if (isConfirmAction) {
        // 1. Disparar confirmação no banco em segundo plano (fire-and-forget, sem await)
        if (confirmUrl) {
            try {
                const fullConfirmUrl = new URL(confirmUrl, self.registration.scope).href;
                fetch(fullConfirmUrl, { method: 'POST' }).catch(e => console.warn('[SW CONFIRM ERROR]', e));
            } catch (eUrl) {
                console.warn('[SW CONFIRM URL ERR]', eUrl);
            }
        }

        // 2. Montar texto e link do WhatsApp
        const msgText = `Olá *${clienteNome}*, seu agendamento para *${servicoNome}* no dia *${dataHoraFormatted}* foi *CONFIRMADO* com sucesso! 🚀`;
        const cleanNum = whatsapp ? String(whatsapp).replace(/\D/g, '') : '';
        const waUrl = cleanNum 
            ? `https://api.whatsapp.com/send?phone=${cleanNum}&text=${encodeURIComponent(msgText)}`
            : targetUrl.href;

        // 3. Notificar a janela da PWA para disparar a abertura do WhatsApp via esquema nativo
        event.waitUntil((async () => {
            const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
            if (windowClients && windowClients.length > 0) {
                for (const c of windowClients) {
                    c.postMessage({ type: 'OPEN_WHATSAPP', url: waUrl });
                }
                return windowClients[0].focus();
            }

            if (clients.openWindow) {
                try {
                    await clients.openWindow(waUrl);
                } catch (e) {
                    console.warn('[SW OPEN WINDOW WARN]', e);
                }
            }
        })());

        return;
    }

    event.waitUntil((async () => {
        // Se clicou na notificação padrão ou no botão "Ver na Agenda"
        const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        const existingClient = windowClients.find(client => {
            const clientUrl = new URL(client.url);
            return clientUrl.origin === targetUrl.origin && clientUrl.pathname === targetUrl.pathname;
        });

        if (existingClient) {
            if ('navigate' in existingClient && existingClient.url !== targetUrl.href) {
                await existingClient.navigate(targetUrl.href);
            }
            return existingClient.focus();
        }

        if (clients.openWindow) {
            return clients.openWindow(targetUrl.href);
        }
    })());
});
