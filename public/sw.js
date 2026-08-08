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
            actions: [
                { action: 'open_agenda', title: '📅 Ver na Agenda' }
            ]
        }
    };
}

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(APP_SHELL_ASSETS).catch(() => {});
      }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      }).then(() => self.clients.claim())
    );
});

// Stale-While-Revalidate strategy for ultra-fast native loading
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/') || e.request.url.includes('/uploads/')) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
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
    const data = event.notification.data || {};
    const targetUrl = new URL(data.url || DEFAULT_URL, self.registration.scope);

    event.waitUntil((async () => {
        const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        const existingClient = windowClients.find(client => {
            const clientUrl = new URL(client.url);
            return clientUrl.origin === targetUrl.origin;
        });

        if (existingClient) {
            if ('navigate' in existingClient) {
                await existingClient.navigate(targetUrl.href);
            }
            return existingClient.focus();
        }

        if (clients.openWindow) {
            return clients.openWindow(targetUrl.href);
        }
    })());
});
