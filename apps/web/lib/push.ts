import { apiClient } from './api/client';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function registerPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const { data } = await apiClient.get<{ publicKey: string }>('/push/vapid-public-key');
  const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

  const subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey.buffer as ArrayBuffer });
  await apiClient.post('/push/subscribe', { subscription: subscription.toJSON() });
  return true;
}

export async function unregisterPush(): Promise<void> {
  await apiClient.delete('/push/unsubscribe');
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  if (reg) {
    const sub = await reg.pushManager.getSubscription();
    await sub?.unsubscribe();
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return sub !== null;
}
