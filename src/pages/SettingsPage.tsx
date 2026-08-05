import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ensurePushSubscription, isIosDevice, isStandalonePwa } from '../utils/push'
import { InstallAppButton } from '../components/InstallAppButton'

export function SettingsPage() {
  const { profile } = useAuth()
  const [status, setStatus] = useState('Проверяем уведомления…')
  const ios = isIosDevice()
  const standalone = isStandalonePwa()

  const syncPush = async () => {
    const res = await ensurePushSubscription()
    if (res.ok) setStatus('Уведомления подключены')
    else setStatus(res.status)
  }

  useEffect(() => {
    // На iOS в Safari автозапрос бесполезен — только подсказка. В установленном PWA можно синкнуть.
    if (ios && !standalone) {
      setStatus(
        'Установите приложение на экран «Домой», откройте его оттуда и нажмите кнопку ниже.',
      )
      return
    }
    void syncPush()
  }, [])

  return (
    <div>
      <section className="page-hero">
        <h1>Настройки</h1>
        <p>Профиль и уведомления.</p>
      </section>
      <div className="panel">
        <p>
          {profile?.email} · {profile?.school?.name}
        </p>

        {ios && !standalone && (
          <div className="hint" style={{ marginBottom: '1rem' }}>
            <p style={{ marginTop: 0 }}>
              На iPhone Web Push работает только после установки на экран «Домой» (iOS 16.4+):
            </p>
            <ol>
              <li>Safari → кнопка «Поделиться»</li>
              <li>«На экран „Домой“» → «Добавить»</li>
              <li>Откройте иконку «Ресурс» с домашнего экрана</li>
              <li>Войдите и нажмите «Подключить уведомления»</li>
            </ol>
            <InstallAppButton className="btn" label="Как установить" />
          </div>
        )}

        <p className="muted">
          Уведомления: утренняя аффирмация, напоминание о дневнике и активность друзей (по расписанию).
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
