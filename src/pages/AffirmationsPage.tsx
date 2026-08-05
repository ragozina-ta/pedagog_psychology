import { useMemo, useState } from 'react'
import { activityApi, profileApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import {
  AFFIRMATION_LABELS,
  AFFIRMATIONS,
  affirmationForDate,
  randomAffirmation,
  type Affirmation,
} from '../data/affirmations'
import { downloadHtmlPdf } from '../utils/pdf'

export function AffirmationsPage() {
  const { profile, refresh } = useAuth()
  const [card, setCard] = useState<Affirmation>(() => affirmationForDate())
  const favorites = profile?.favorite_affirmations ?? []

  const favCards = useMemo(
    () => AFFIRMATIONS.filter((a) => favorites.includes(a.id)),
    [favorites],
  )

  const downloadPng = () => {
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
    ctx.font = '28px Manrope, sans-serif'
    ctx.fillText('РЕСУРС', 90, 200)
    ctx.fillStyle = '#f7f1e6'
    ctx.font = '600 52px "Source Serif 4", Georgia, serif'
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
    ctx.font = '26px Manrope, sans-serif'
    ctx.fillStyle = '#ecd09c'
    ctx.fillText(AFFIRMATION_LABELS[card.category], 90, y + 90)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `affirmaciya-${card.id}.png`
    a.click()
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
    const items = AFFIRMATIONS.map(
      (a, i) =>
        `<div style="break-inside:avoid;border:1px solid #ddd;padding:12px;margin-bottom:8px;border-radius:12px">
          <div style="color:#c18636;font-size:11px">${i + 1}. ${AFFIRMATION_LABELS[a.category]}</div>
          <div>${a.text}</div>
        </div>`,
    ).join('')
    await downloadHtmlPdf(
      `<div style="font-family:Manrope,Arial;color:#31464f"><h1 style="color:#703a14">Колода аффирмаций</h1>${items}</div>`,
      'koloda-affirmaciy.pdf',
    )
  }

  return (
    <div>
      <section className="page-hero">
        <h1>Аффирмации</h1>
        <p>Колода из 120 карт. Вытяните карту, сохраните заставку, добавьте в избранное.</p>
      </section>

      <div className="card-deck">
        <div style={{ letterSpacing: '0.1em', fontSize: '0.75rem', textTransform: 'uppercase', color: '#ecd09c' }}>
          {AFFIRMATION_LABELS[card.category]}
        </div>
        <h2 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', color: '#f7f1e6', margin: 0 }}>{card.text}</h2>
      </div>

      <div className="btn-row">
        <button type="button" className="btn" onClick={() => void drawNew()}>
          Вытянуть новую
        </button>
        <button type="button" className="btn secondary" onClick={downloadPng}>
          Скачать заставку
        </button>
        <button type="button" className="btn ghost" onClick={() => void toggleFav()}>
          {favorites.includes(card.id) ? 'В избранном' : 'В избранное'}
        </button>
        <button type="button" className="btn ghost" onClick={() => void downloadDeck()}>
          PDF колоды
        </button>
      </div>

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
