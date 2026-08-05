import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { activityApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { DAILY_CARDS, cardForDate } from '../data/cards'
import { downloadHtmlPdf } from '../utils/pdf'

export function CardsPage() {
  const { refresh } = useAuth()
  const today = cardForDate()
  const [index, setIndex] = useState(() => DAILY_CARDS.findIndex((c) => c.id === today.id))
  const card = DAILY_CARDS[index] ?? today
  const categories = useMemo(() => [...new Set(DAILY_CARDS.map((c) => c.category))], [])
  const [msg, setMsg] = useState('')

  const complete = async () => {
    try {
      const r = await activityApi.log('card', { id: card.id })
      setMsg(`+${r.points_awarded} очков`)
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Уже отмечено сегодня')
    }
  }

  return (
    <div>
      <section className="page-hero">
        <h1>Ресурсные карточки</h1>
        <p>Колода из {DAILY_CARDS.length} микрозаданий. Цифровой формат и PDF для печати.</p>
      </section>
      <div className="card-deck">
        <div style={{ color: '#ecd09c', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {card.category} · {index + 1}/{DAILY_CARDS.length}
        </div>
        <h2 style={{ color: '#f7f1e6', fontSize: '2rem', margin: 0 }}>{card.title}</h2>
        <p style={{ color: '#f7f1e6', fontSize: '1.1rem', margin: 0 }}>{card.task}</p>
      </div>
      <div className="btn-row">
        <button type="button" className="btn secondary" onClick={() => setIndex((i) => (i - 1 + DAILY_CARDS.length) % DAILY_CARDS.length)}>
          Назад
        </button>
        <button type="button" className="btn" onClick={() => setIndex((i) => (i + 1) % DAILY_CARDS.length)}>
          Следующая
        </button>
        <button type="button" className="btn ghost" onClick={() => void complete()}>
          Выполнил
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() =>
            void downloadHtmlPdf(
              `<div style="font-family:Manrope;color:#31464f"><h1 style="color:#703a14">${card.title}</h1><p>${card.category}</p><p>${card.task}</p><p>${format(new Date(), 'd MMMM yyyy', { locale: ru })}</p></div>`,
              `kartochka-${card.id}.pdf`,
            )
          }
        >
          PDF карточки
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() =>
            void downloadHtmlPdf(
              `<div style="font-family:Manrope;color:#31464f"><h1 style="color:#703a14">Колода карточек</h1>${DAILY_CARDS.map((c, i) => `<div style="border:1px solid #ddd;padding:10px;margin:8px 0;border-radius:10px"><b>${i + 1}. ${c.title}</b> (${c.category})<div>${c.task}</div></div>`).join('')}</div>`,
              'koloda-kartochek.pdf',
            )
          }
        >
          PDF колоды
        </button>
      </div>
      {msg && <p className="muted">{msg}</p>}
      <div className="chip-row">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className="chip"
            onClick={() => {
              const i = DAILY_CARDS.findIndex((c) => c.category === cat)
              if (i >= 0) setIndex(i)
            }}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}
