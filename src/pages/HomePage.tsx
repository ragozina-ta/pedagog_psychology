import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { activityApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { InstallAppButton } from '../components/InstallAppButton'
import { affirmationForDate } from '../data/affirmations'
import { cardForDate } from '../data/cards'

export function HomePage() {
  const { profile, refresh } = useAuth()
  const affirmation = affirmationForDate()
  const card = cardForDate()
  const [mood, setMood] = useState<string | null>(null)
  const [doneCard, setDoneCard] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    const greet = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'
    document.title = `Ресурс — ${greet}`
  }, [])

  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'

  const onMood = async (m: string) => {
    setMood(m)
    try {
      await activityApi.log('mood_check', { mood: m })
      await refresh()
    } catch {
      /* offline ok */
    }
  }

  const completeCard = async () => {
    try {
      const r = await activityApi.log('card', { id: card.id })
      setDoneCard(true)
      setMsg(r.new_achievements.length ? `Новая ачивка!` : `+${r.points_awarded} очков`)
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  return (
    <div>
      <section className="page-hero">
        <h1>
          {greet}
          {profile ? `, ${profile.full_name.split(' ')[0]}` : ''}!
        </h1>
        <p>
          Серия: <strong>{profile?.streak ?? 0}</strong> дней · Уровень: {profile?.level ?? '—'} · Очки:{' '}
          {profile?.points ?? 0}
        </p>
        <div className="btn-row">
          <InstallAppButton className="btn" label="Скачать приложение" />
        </div>
      </section>

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--brand)', fontSize: '1.1rem' }}>Как твоё настроение?</h2>
        <div className="mood-row">
          {[
            ['happy', '😊'],
            ['neutral', '😐'],
            ['sad', '😞'],
          ].map(([id, ico]) => (
            <button
              key={id}
              type="button"
              className={`mood-btn ${mood === id ? 'active' : ''}`}
              onClick={() => void onMood(id)}
            >
              {ico}
            </button>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <div className="eyebrow" style={{ color: 'var(--accent)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
          Карточка дня · {card.category}
        </div>
        <h2 style={{ color: 'var(--brand)' }}>{card.title}</h2>
        <p style={{ color: 'var(--ink)' }}>{card.task}</p>
        <div className="btn-row">
          <button type="button" className="btn" disabled={doneCard} onClick={() => void completeCard()}>
            {doneCard ? 'Выполнено' : 'Выполнил'}
          </button>
          <Link className="btn secondary" to="/cards">
            Все карточки
          </Link>
        </div>
        {msg && <p className="muted">{msg}</p>}
      </div>

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <div style={{ color: 'var(--accent)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Аффирмация дня</div>
        <h2 style={{ color: 'var(--brand)', fontSize: '1.35rem' }}>{affirmation.text}</h2>
        <Link className="btn ghost" to="/affirmations">
          Открыть колоду
        </Link>
      </div>

      <div className="grid-modules">
        {[
          { to: '/wheel', title: 'Колесо баланса', text: '8 сфер · сектора' },
          { to: '/resources', title: 'Ресурсный банк', text: 'Техники и скрипты' },
          { to: '/diary', title: 'Дневник', text: 'Рефлексия без давления' },
          { to: '/wish-map', title: 'Карта желаний', text: 'Только картинки' },
          { to: '/chat', title: 'Выговориться', text: 'Компас и чат школы' },
        ].map((m) => (
          <Link key={m.to} to={m.to} className="module-link">
            <div className="eyebrow">перейти</div>
            <h2>{m.title}</h2>
            <p>{m.text}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
