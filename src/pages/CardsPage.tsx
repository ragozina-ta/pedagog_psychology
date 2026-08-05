import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { activityApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { PlayingCard } from '../components/PlayingCard'
import { DAILY_CARDS, cardForDate } from '../data/cards'
import { saveBlob } from '../utils/download'
import { singleDailyCardHtml } from '../utils/playingCardHtml'
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
      <div className="playing-card-wrap">
        <PlayingCard
          eyebrow={`${card.category} · ${index + 1}/${DAILY_CARDS.length}`}
          title={card.title}
          corner="♥"
        >
          {card.task}
        </PlayingCard>
      </div>
      <div className="btn-row">
        <button
          type="button"
          className="btn secondary"
          onClick={() => setIndex((i) => (i - 1 + DAILY_CARDS.length) % DAILY_CARDS.length)}
        >
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
              singleDailyCardHtml({
                category: card.category,
                title: card.title,
                task: card.task,
                dateLabel: format(new Date(), 'd MMMM yyyy', { locale: ru }),
              }),
              `kartochka-${card.id}.pdf`,
              420,
            ).then((r) => setMsg(r.ok ? 'PDF готов' : r.error))
          }
        >
          PDF карточки
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() =>
            void (async () => {
              setMsg('Скачиваем PDF колоды…')
              try {
                const res = await fetch(`${import.meta.env.BASE_URL}decks/koloda-kartochek.pdf`)
                if (!res.ok) throw new Error('Файл колоды не найден')
                const blob = await res.blob()
                const saved = await saveBlob(blob, 'koloda-kartochek.pdf')
                setMsg(saved.ok ? 'PDF колоды скачан' : saved.error)
              } catch (e) {
                setMsg(e instanceof Error ? e.message : 'Не удалось скачать')
              }
            })()
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
