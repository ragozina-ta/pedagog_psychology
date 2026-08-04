import { useEffect, useRef, useState } from 'react'
import { ALARM_RESPONSE } from '../data/compass'
import { useAppStore } from '../store/useAppStore'
import { askCompass } from '../utils/compassApi'

export function CompassPage() {
  const messages = useAppStore((s) => s.chatMessages)
  const addChatMessage = useAppStore((s) => s.addChatMessage)
  const clearChat = useAppStore((s) => s.clearChat)
  const settings = useAppStore((s) => s.settings)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  const send = async (content: string, urgent = false) => {
    const trimmed = content.trim()
    if (!trimmed || busy) return
    setText('')
    addChatMessage({ role: 'user', content: trimmed, urgent })
    setBusy(true)
    try {
      const reply = urgent
        ? ALARM_RESPONSE
        : await askCompass({
            apiKey: settings.openaiApiKey,
            baseUrl: settings.openaiBaseUrl,
            model: settings.openaiModel,
            history: messages,
            userText: trimmed,
          })
      addChatMessage({ role: 'assistant', content: reply, urgent })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <section className="page-hero">
        <h1>Психологический компас</h1>
        <p>
          Анонимный эмпатичный собеседник 24/7. Работает офлайн по сценариям поддержки; при
          наличии API-ключа — через ИИ. Данные чата хранятся только у вас.
        </p>
      </section>

      <div className="panel" style={{ display: 'grid', gridTemplateRows: '1fr auto', minHeight: 480 }}>
        <div style={{ display: 'grid', gap: '0.75rem', maxHeight: 420, overflow: 'auto', paddingRight: 4 }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                justifySelf: m.role === 'user' ? 'end' : 'start',
                maxWidth: '90%',
                padding: '0.75rem 0.9rem',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.urgent
                  ? 'var(--danger-soft)'
                  : m.role === 'user'
                    ? 'rgba(26,74,69,0.12)'
                    : '#fff',
                border: '1px solid var(--line)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.45,
              }}
            >
              {m.content}
            </div>
          ))}
          {busy && <div className="muted">Компас думает…</div>}
          <div ref={endRef} />
        </div>

        <div style={{ marginTop: '1rem' }}>
          <div className="btn-row" style={{ marginBottom: '0.75rem' }}>
            <button type="button" className="btn danger" onClick={() => send('Мне нужна срочная поддержка', true)}>
              Тревога
            </button>
            <button type="button" className="btn ghost" onClick={() => clearChat()}>
              Очистить чат
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void send(text)
            }}
            style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Напишите, что происходит…"
              rows={3}
              style={{ borderRadius: 12, border: '1px solid var(--line)', padding: '0.7rem', resize: 'vertical' }}
            />
            <button type="submit" className="btn" disabled={busy || !text.trim()}>
              Отправить
            </button>
          </form>
          <p className="muted" style={{ marginTop: 8 }}>
            При угрозе жизни или насилия: 112, полиция, администрация школы. Компас не заменяет
            профессиональную помощь.
          </p>
        </div>
      </div>
    </div>
  )
}
