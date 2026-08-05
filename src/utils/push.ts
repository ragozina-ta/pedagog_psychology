import { pushApi } from '../api/client'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export type PushResult =
  | { ok: true; status: 'subscribed' | 'already' }
  | { ok: false; status: string }

/** Подписка на Web Push. Безопасно вызывать повторно. */
export async function ensurePushSubscription(): Promise<PushResult> {
  if (typeof window === 'undefined') return { ok: false, status: 'ssr' }
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return { ok: false, status: 'Push не поддерживается в этом браузере' }
  }

  let permission = Notification.permission
  if (permission === 'default') {
    permission = await Notification.requestPermission()
  }
  if (permission !== 'granted') {
    return { ok: false, status: 'Разрешение на уведомления не выдано' }
  }

  const { publicKey } = await pushApi.vapid()
  if (!publicKey) {
    return { ok: false, status: 'VAPID-ключ не настроен на сервере' }
  }

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }
  await pushApi.subscribe(sub.toJSON())
  return { ok: true, status: 'subscribed' }
}
