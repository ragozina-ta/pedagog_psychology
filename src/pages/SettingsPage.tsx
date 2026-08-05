import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ensurePushSubscription } from '../utils/push'

export function SettingsPage() {
  const { profile } = useAuth()
  const [status, setStatus] = useState('Проверяем уведомления…')

  const syncPush = async () => {
    const res = await ensurePushSubscription()
    if (res.ok) setStatus('Уведомления подключены')
    else setStatus(res.status)
  }

  useEffect(() => {
    void syncPush()
  }, [])

  return (
    <div>
      <section className="page-hero">
        <h1>Настройки</h1>
        <p>Профиль и уведомления. Подписка включается автоматически при входе.</p>
      </section>
      <div className="panel">
        <p>
          {profile?.email} · {profile?.school?.name}
        </p>
        <p className="muted">
          Сейчас включён тестовый режим: пуши примерно каждые 30 секунд. В проде — утро (аффирмация), дневник и активность
          друзей.
        </p>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => void syncPush()}>
            Подключить уведомления
          </button>
        </div>
        <p className="muted">{status}</p>
      </div>
    </div>
  )
}
