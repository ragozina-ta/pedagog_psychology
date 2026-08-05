import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { activityApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { InstallAppButton } from '../components/InstallAppButton'
import { PlayingCard } from '../components/PlayingCard'
import { affirmationForDate } from '../data/affirmations'
import { cardForDate } from '../data/cards'

function moodKey() {
  const d = new Date()
  return `mood:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function HomePage() {
  const { profile, refresh } = useAuth()
  const affirmation = affirmationForDate()
  const card = cardForDate()
  const [mood, setMood] = useState<string | null>(() => {
    try {
      return localStorage.getItem(moodKey())
    } catch {
      return null
    }
  })
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
      localStorage.setItem(moodKey(), m)
    } catch {
      /* */
    }
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
        {mood && mood !== 'happy' && (
          <div className="btn-row">
            <Link className="btn secondary" to="/app/resources?open=r1">
              Сделать технику из ресурсного банка
            </Link>
          </div>
        )}
      </div>

      <div className="playing-card-wrap">
        <PlayingCard eyebrow={`Карточка дня · ${card.category}`} title={card.title} corner="♥">
          {card.task}
        </PlayingCard>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button type="button" className="btn" disabled={doneCard} onClick={() => void completeCard()}>
            {doneCard ? 'Выполнено' : 'Выполнил'}
          </button>
          <Link className="btn secondary" to="/app/cards">
            Все карточки
          </Link>
        </div>
        {msg && <p className="muted">{msg}</p>}
      </div>

      <div className="playing-card-wrap">
        <PlayingCard eyebrow="Аффирмация дня" variant="accent" corner="♥">
          {affirmation.text}
        </PlayingCard>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <Link className="btn ghost" to="/app/affirmations">
            Открыть колоду
          </Link>
        </div>
      </div>

      <div className="grid-modules">
        {[
          { to: '/app/wheel', title: 'Колесо баланса', text: '8 сфер · сектора' },
          { to: '/app/resources', title: 'Ресурсный банк', text: 'Техники и скрипты' },
          { to: '/app/diary', title: 'Дневник', text: 'Рефлексия без давления' },
          { to: '/app/wish-map', title: 'Карта желаний', text: 'Цели, мечты и планы на будущее' },
          { to: '/app/chat', title: 'Выговориться', text: 'Компас и чат школы' },
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
