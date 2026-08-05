import { useEffect, useState } from 'react'
import { pushApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function SettingsPage() {
  const { profile } = useAuth()
  const [status, setStatus] = useState('')

  useEffect(() => {
    setStatus(Notification?.permission === 'granted' ? 'Уведомления разрешены' : 'Уведомления не включены')
  }, [])

  const enablePush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatus('Push не поддерживается в этом браузере')
        return
      }
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setStatus('Разрешение не выдано')
        return
      }
      const { publicKey } = await pushApi.vapid()
      if (!publicKey) {
        setStatus('VAPID-ключ не настроен на сервере. Подписка сохранена локально как готовность.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      await pushApi.subscribe(sub.toJSON())
      setStatus('Подписка на push оформлена')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Ошибка push')
    }
  }

  return (
    <div>
      <section className="page-hero">
        <h1>Настройки</h1>
        <p>ИИ-компас работает через сервер. Ключ OpenAI хранится только на бэкенде.</p>
      </section>
      <div className="panel">
        <p>
          {profile?.email} · {profile?.school?.name}
        </p>
        <p className="muted">
          Пуши: утром аффирмация (~07:45), раз в 3 дня вечером — мягкое приглашение в дневник, уведомление об активности
          друга.
        </p>
        <button type="button" className="btn" onClick={() => void enablePush()}>
          Включить уведомления
        </button>
        <p className="muted">{status}</p>
      </div>
    </div>
  )
}
