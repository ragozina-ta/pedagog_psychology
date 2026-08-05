import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ensurePushSubscription } from '../utils/push'

/**
 * После входа автоматически запрашивает разрешение и подписывает на push.
 */
export function AutoPushSubscribe() {
  const { profile } = useAuth()
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    void (async () => {
      try {
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
      Уведомления: {hint}. Разрешите их во всплывающем окне браузера или зайдите в{' '}
      <Link to="/settings">Настройки</Link> и нажмите «Подключить уведомления».
    </div>
  )
}
