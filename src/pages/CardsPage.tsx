import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { DAILY_CARDS, cardForDate } from '../data/cards'
import { downloadHtmlPdf } from '../utils/pdf'

export function CardsPage() {
  const today = cardForDate()
  const [index, setIndex] = useState(() => DAILY_CARDS.findIndex((c) => c.id === today.id))
  const card = DAILY_CARDS[index] ?? today

  const categories = useMemo(() => [...new Set(DAILY_CARDS.map((c) => c.category))], [])

  const exportOne = async () => {
    await downloadHtmlPdf(
      `<div style="font-family:Manrope,Arial,sans-serif;color:#1c2421">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#c47b3b">Карточка дня</div>
        <h1 style="font-family:Georgia,serif;color:#1a4a45;font-size:32px">${card.title}</h1>
        <p style="font-size:14px;color:#7d9b8a">${card.category}</p>
        <p style="font-size:18px;line-height:1.5">${card.task}</p>
        <p style="margin-top:40px;font-size:12px;color:#5a6862">Ресурс педагога · ${format(new Date(), 'd MMMM yyyy', { locale: ru })}</p>
      </div>`,
      `kartochka-${card.id}.pdf`,
    )
  }

  const exportDeck = async () => {
    const items = DAILY_CARDS.map(
      (c, i) =>
        `<div style="break-inside:avoid;border:1px solid #ddd;border-radius:12px;padding:14px;margin-bottom:10px">
          <div style="font-size:11px;color:#c47b3b">${i + 1}. ${c.category}</div>
          <strong style="color:#1a4a45">${c.title}</strong>
          <div style="margin-top:6px">${c.task}</div>
        </div>`,
    ).join('')
    await downloadHtmlPdf(
      `<div style="font-family:Manrope,Arial,sans-serif;color:#1c2421">
        <h1 style="font-family:Georgia,serif;color:#1a4a45">Колода карточек дня</h1>
        <p>Микрозадания для педагога · печатная версия</p>
        ${items}
      </div>`,
      'koloda-kartochek.pdf',
      794,
    )
  }

  return (
    <div>
      <section className="page-hero">
        <h1>Карточки дня</h1>
        <p>Готовая колода микрозаданий. Откройте цифровую карточку или скачайте PDF для печати.</p>
      </section>

      <div
        className="panel"
        style={{
          minHeight: 280,
          display: 'grid',
          alignContent: 'center',
          gap: '0.75rem',
          background: 'linear-gradient(160deg, #fffaf3, #e7f0e8)',
        }}
      >
        <div style={{ color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {card.category} · {index + 1}/{DAILY_CARDS.length}
        </div>
        <h2 style={{ fontSize: '2rem', color: 'var(--brand)' }}>{card.title}</h2>
        <p style={{ fontSize: '1.15rem', color: 'var(--ink)', maxWidth: 520 }}>{card.task}</p>
        <div className="btn-row">
          <button type="button" className="btn secondary" onClick={() => setIndex((i) => (i - 1 + DAILY_CARDS.length) % DAILY_CARDS.length)}>
            Назад
          </button>
          <button type="button" className="btn" onClick={() => setIndex((i) => (i + 1) % DAILY_CARDS.length)}>
            Следующая
          </button>
          <button type="button" className="btn ghost" onClick={exportOne}>
            PDF этой карточки
          </button>
          <button type="button" className="btn ghost" onClick={exportDeck}>
            PDF всей колоды
          </button>
        </div>
      </div>

      <div className="chip-row" style={{ marginTop: '1rem' }}>
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
