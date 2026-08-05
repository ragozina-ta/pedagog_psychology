import { useMemo, useState } from 'react'
import { activityApi, profileApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { PlayingCard } from '../components/PlayingCard'
import {
  AFFIRMATION_LABELS,
  AFFIRMATIONS,
  affirmationForDate,
  randomAffirmation,
  type Affirmation,
} from '../data/affirmations'
import { dataUrlToBlob, saveBlob } from '../utils/download'
import { singleAffirmationCardHtml } from '../utils/playingCardHtml'
import { downloadHtmlPdf } from '../utils/pdf'

export function AffirmationsPage() {
  const { profile, refresh } = useAuth()
  const [card, setCard] = useState<Affirmation>(() => affirmationForDate())
  const [status, setStatus] = useState('')
  const favorites = profile?.favorite_affirmations ?? []

  const favCards = useMemo(
    () => AFFIRMATIONS.filter((a) => favorites.includes(a.id)),
    [favorites],
  )

  const downloadPng = async () => {
    setStatus('Готовим заставку…')
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const g = ctx.createLinearGradient(0, 0, 1080, 1920)
    g.addColorStop(0, '#703a14')
    g.addColorStop(0.5, '#a46957')
    g.addColorStop(1, '#c18636')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 1080, 1920)
    ctx.fillStyle = 'rgba(236,208,156,0.2)'
    ctx.beginPath()
    ctx.arc(900, 240, 200, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ecd09c'
    ctx.font = '28px Nunito, sans-serif'
    ctx.fillText('РЕСУРС', 90, 200)
    ctx.fillStyle = '#f7f1e6'
    ctx.font = '600 52px Literata, Georgia, serif'
    const words = card.text.split(' ')
    let line = ''
    let y = 780
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (ctx.measureText(test).width > 900) {
        ctx.fillText(line, 90, y)
        line = w
        y += 70
      } else line = test
    }
    if (line) ctx.fillText(line, 90, y)
    ctx.font = '26px Nunito, sans-serif'
    ctx.fillStyle = '#ecd09c'
    ctx.fillText(AFFIRMATION_LABELS[card.category], 90, y + 90)
    const blob = await dataUrlToBlob(canvas.toDataURL('image/png'))
    const res = await saveBlob(blob, `affirmaciya-${card.id}.png`)
    if (res.ok) {
      setStatus(res.method === 'share' ? 'Откройте «Сохранить изображение» в меню Share' : 'Заставка сохранена')
    } else {
      setStatus(res.error)
    }
  }

  const drawNew = async () => {
    setCard(randomAffirmation(card.id))
    try {
      await activityApi.log('affirmation', { id: card.id })
      await refresh()
    } catch {
      /* */
    }
  }

  const toggleFav = async () => {
    const next = favorites.includes(card.id)
      ? favorites.filter((id) => id !== card.id)
      : [...favorites, card.id]
    await profileApi.update({ favorite_affirmations: next })
    await refresh()
  }

  const downloadDeck = async () => {
    setStatus('Скачиваем PDF колоды…')
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}decks/koloda-affirmaciy.pdf`)
      if (!res.ok) throw new Error('Файл колоды не найден')
      const blob = await res.blob()
      const saved = await saveBlob(blob, 'koloda-affirmaciy.pdf')
      setStatus(saved.ok ? 'PDF колоды скачан' : saved.error)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Не удалось скачать')
    }
  }

  const downloadOnePdf = async () => {
    setStatus('Готовим PDF…')
    const res = await downloadHtmlPdf(
      singleAffirmationCardHtml({ categoryLabel: AFFIRMATION_LABELS[card.category], text: card.text }),
      `affirmaciya-${card.id}.pdf`,
      420,
    )
    setStatus(res.ok ? 'PDF готов' : res.error)
  }

  return (
    <div>
      <section className="page-hero">
        <h1>Аффирмации</h1>
        <p>Колода из 120 карт. Вытяните карту, сохраните заставку, добавьте в избранное.</p>
      </section>

      <div className="playing-card-wrap">
        <PlayingCard eyebrow={AFFIRMATION_LABELS[card.category]} variant="accent" corner="♥">
          {card.text}
        </PlayingCard>
      </div>

      <div className="btn-row">
        <button type="button" className="btn" onClick={() => void drawNew()}>
          Вытянуть новую
        </button>
        <button type="button" className="btn secondary" onClick={() => void downloadPng()}>
          Скачать заставку
        </button>
        <button type="button" className="btn ghost" onClick={() => void downloadOnePdf()}>
          PDF карты
        </button>
        <button type="button" className="btn ghost" onClick={() => void toggleFav()}>
          {favorites.includes(card.id) ? 'В избранном' : 'В избранное'}
        </button>
        <button type="button" className="btn ghost" onClick={() => void downloadDeck()}>
          PDF колоды
        </button>
      </div>
      {status && <p className="muted">{status}</p>}

      <h2 style={{ color: 'var(--brand)', marginTop: '1.5rem' }}>Мои любимые</h2>
      <div className="grid-modules">
        {favCards.map((a) => (
          <button key={a.id} type="button" className="panel" style={{ textAlign: 'left' }} onClick={() => setCard(a)}>
            <div className="muted" style={{ fontSize: '0.75rem' }}>
              {AFFIRMATION_LABELS[a.category]}
            </div>
            <p style={{ color: 'var(--ink)', margin: 0 }}>{a.text}</p>
          </button>
        ))}
        {!favCards.length && <p className="muted">Избранных пока нет.</p>}
      </div>
    </div>
  )
}
