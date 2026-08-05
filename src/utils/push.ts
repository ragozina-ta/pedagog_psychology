import { pushApi } from '../api/client'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function isStandalonePwa() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

export type PushResult =
  | { ok: true; status: 'subscribed' | 'already' }
  | { ok: false; status: string; code?: 'ios_install' | 'unsupported' | 'denied' | 'vapid' | 'other' }

/** Подписка на Web Push. На iOS работает только из PWA «На экран Домой» и лучше по клику. */
export async function ensurePushSubscription(): Promise<PushResult> {
  if (typeof window === 'undefined') return { ok: false, status: 'ssr', code: 'other' }

  const ios = isIosDevice()
  const standalone = isStandalonePwa()

  // В обычной вкладке Safari на iPhone PushManager нет — нужна установка на Домой
  if (ios && !standalone) {
    return {
      ok: false,
      code: 'ios_install',
      status:
        'На iPhone уведомления работают только из приложения на экране «Домой». Safari → Поделиться → На экран «Домой», затем откройте иконку и нажмите «Подключить уведомления».',
    }
  }

  if (!('serviceWorker' in navigator)) {
    return { ok: false, status: 'Service Worker не поддерживается', code: 'unsupported' }
  }
  if (!('Notification' in window)) {
    return {
      ok: false,
      code: ios ? 'ios_install' : 'unsupported',
      status: ios
        ? 'Откройте приложение с экрана «Домой» (не из Safari), затем подключите уведомления.'
        : 'Уведомления не поддерживаются в этом браузере',
    }
  }
  if (!('PushManager' in window)) {
    return {
      ok: false,
      code: ios ? 'ios_install' : 'unsupported',
      status: ios
        ? 'Push недоступен в Safari. Установите на «Домой» и откройте оттуда.'
        : 'Push не поддерживается в этом браузере',
    }
  }

  let permission = Notification.permission
  if (permission === 'default') {
    permission = await Notification.requestPermission()
  }
  if (permission !== 'granted') {
    return { ok: false, status: 'Разрешение на уведомления не выдано', code: 'denied' }
  }

  const { publicKey } = await pushApi.vapid()
  if (!publicKey) {
    return { ok: false, status: 'VAPID-ключ не настроен на сервере', code: 'vapid' }
  }

  const reg = await navigator.serviceWorker.ready
  if (!reg.pushManager) {
    return {
      ok: false,
      code: 'ios_install',
      status: 'PushManager недоступен. Откройте приложение с экрана «Домой».',
    }
  }

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
