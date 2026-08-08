import { apiRequest } from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerWebPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    console.warn('[WEB PUSH] Ambientes sem suporte a Web Push.');
    return;
  }

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.warn('[WEB PUSH] Permissão de notificação não concedida.');
      return;
    }

    const { publicKey } = await apiRequest('/notifications/public-key');
    if (!publicKey) {
      console.warn('[WEB PUSH] Chave pública VAPID não disponível.');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    const subJson = subscription.toJSON();
    const endpoint = subJson.endpoint;
    const p256dh = subJson.keys?.p256dh || '';
    const auth = subJson.keys?.auth || '';

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const plataforma = isIOS ? 'ios' : isAndroid ? 'android' : 'web';

    await apiRequest('/notifications/subscribe', 'POST', {
      endpoint,
      p256dh,
      auth,
      user_agent: navigator.userAgent,
      plataforma
    });

    console.log('[WEB PUSH] Inscrição de Notificações Push registrada no celular com sucesso! Plataforma:', plataforma);
  } catch (err) {
    console.error('[WEB PUSH ERROR] Falha ao registrar assinatura push:', err);
  }
}
