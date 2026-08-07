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
    const targetUrl = new URL(data.url || DEFAULT_URL, self.registration.scope);

    // Botão "Confirmar & WhatsApp" ou clique no corpo da notificação
    const isConfirmAction = action === 'confirm_whatsapp' || (data.whatsapp && action !== 'open_agenda');

    event.waitUntil((async () => {
        if (isConfirmAction) {
            // Construir a URL da página de confirmação (dentro da própria PWA)
            // A página ConfirmarAgendamento.jsx faz tudo:
            // 1. Chama o backend para confirmar + cadastrar cliente
            // 2. Busca o template de mensagem das configurações
            // 3. Redireciona para wa.me com a mensagem formatada
            const confirmPageUrl = new URL('/confirmar-agendamento', self.registration.scope);
            confirmPageUrl.searchParams.set('slug', data.tenantSlug || '');
            confirmPageUrl.searchParams.set('id', data.agendamentoId || '');
            confirmPageUrl.searchParams.set('phone', data.whatsapp || '');
            confirmPageUrl.searchParams.set('nome', data.clienteNome || 'Cliente');
            confirmPageUrl.searchParams.set('servico', data.servicoNome || 'Serviço');
            confirmPageUrl.searchParams.set('dataHora', data.dataHoraFormatted || '');

            if (clients.openWindow) {
                return clients.openWindow(confirmPageUrl.href);
            }
        }

        // Botão "Ver na Agenda" ou clique padrão
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
