import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ensurePushSubscription, isIosDevice, isStandalonePwa } from '../utils/push'

/**
 * После входа подписывает на push.
 * На iPhone — только если открыто как PWA с «Домой»; иначе показывает инструкцию.
 */
export function AutoPushSubscribe() {
  const { profile } = useAuth()
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    void (async () => {
      try {
        if (isIosDevice() && !isStandalonePwa()) {
          if (!cancelled) {
            setHint(
              'На iPhone уведомления доступны только из приложения на экране «Домой». Установите через Safari → Поделиться → На экран «Домой».',
            )
          }
          return
        }
        const res = await ensurePushSubscription()
        if (cancelled) return
        if (res.ok) setHint(null)
        else setHint(res.status)
      } catch {
        if (!cancelled) setHint('Не удалось подключить уведомления автоматически')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [profile?.user_id])

  if (!hint) return null

  return (
    <div className="hint" style={{ margin: '0 0 1rem' }}>
      Уведомления: {hint}{' '}
      <Link to="/app/settings">Настройки</Link>
    </div>
  )
}
