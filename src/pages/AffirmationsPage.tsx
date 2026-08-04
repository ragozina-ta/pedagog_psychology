import { useRef } from 'react'
import { AFFIRMATION_LABELS, affirmationForDate, AFFIRMATIONS } from '../data/affirmations'
import { elementToPdf } from '../utils/pdf'

export function AffirmationsPage() {
  const today = affirmationForDate()
  const wallpaperRef = useRef<HTMLDivElement>(null)

  const downloadWallpaper = async () => {
    if (!wallpaperRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const g = ctx.createLinearGradient(0, 0, 1080, 1920)
    g.addColorStop(0, '#1a4a45')
    g.addColorStop(0.55, '#2f6b64')
    g.addColorStop(1, '#7d9b8a')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 1080, 1920)

    ctx.fillStyle = 'rgba(255,250,243,0.12)'
    ctx.beginPath()
    ctx.arc(860, 280, 220, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(180, 1600, 280, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#e8b86d'
    ctx.font = '28px Manrope, sans-serif'
    ctx.fillText('РЕСУРС ПЕДАГОГА', 100, 220)

    ctx.fillStyle = '#fffaf3'
    ctx.font = '600 56px "Source Serif 4", Georgia, serif'
    const words = today.text.split(' ')
    let line = ''
    let y = 820
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (ctx.measureText(test).width > 880) {
        ctx.fillText(line, 100, y)
        line = w
        y += 74
      } else {
        line = test
      }
    }
    if (line) ctx.fillText(line, 100, y)

    ctx.font = '28px Manrope, sans-serif'
    ctx.fillStyle = '#c8d9c4'
    ctx.fillText(AFFIRMATION_LABELS[today.category], 100, y + 100)

    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'affirmaciya-zastavka.png'
    a.click()
  }

  const exportPdf = async () => {
    if (!wallpaperRef.current) return
    await elementToPdf(wallpaperRef.current, 'affirmaciya-dnya.pdf')
  }

  return (
    <div>
      <section className="page-hero">
        <h1>Аффирмации на день</h1>
        <p>Поддерживающая фраза каждый день. Можно открыть на экране или сохранить картинку-заставку.</p>
      </section>

      <div
        ref={wallpaperRef}
        className="panel"
        style={{
          background: 'linear-gradient(155deg, #1a4a45, #2f6b64 55%, #7d9b8a)',
          color: '#fffaf3',
          minHeight: 280,
          display: 'grid',
          alignContent: 'center',
          gap: '0.75rem',
        }}
      >
        <div style={{ color: '#e8b86d', letterSpacing: '0.12em', fontSize: '0.75rem', textTransform: 'uppercase' }}>
          {AFFIRMATION_LABELS[today.category]}
        </div>
        <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', color: '#fffaf3', maxWidth: 640 }}>
          {today.text}
        </h2>
      </div>

      <div className="btn-row">
        <button type="button" className="btn" onClick={downloadWallpaper}>
          Скачать заставку (PNG)
        </button>
        <button type="button" className="btn secondary" onClick={exportPdf}>
          PDF
        </button>
      </div>

      <h2 style={{ color: 'var(--brand)', marginTop: '1.5rem' }}>Ещё фразы</h2>
      <div className="grid-modules">
        {AFFIRMATIONS.filter((a) => a.id !== today.id).slice(0, 8).map((a) => (
          <div key={a.id} className="panel">
            <div className="muted" style={{ fontSize: '0.75rem', marginBottom: 6 }}>
              {AFFIRMATION_LABELS[a.category]}
            </div>
            <p style={{ color: 'var(--ink)', margin: 0 }}>{a.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
