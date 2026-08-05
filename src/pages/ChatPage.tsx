import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { chatApi, compassApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'

type Msg = { id?: number; sender_name?: string | null; content: string; role?: string }

export function ChatPage() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<'school' | 'bot' | 'challenges'>('school')
  const [roomId, setRoomId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [botMsgs, setBotMsgs] = useState<Msg[]>([
    {
      content:
        'Я «Психологический компас». Можно выговориться анонимно. При острой нужде — кнопка «Тревога» и линия +7 (495) 989-50-50.',
      role: 'assistant',
    },
  ])
  const [challenges, setChallenges] = useState<{ id: number; title: string; days: number; my_progress: number }[]>([])
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const room = await chatApi.schoolRoom()
        setRoomId(room.id)
        setMessages(await chatApi.messages(room.id))
        setChallenges(await chatApi.challenges())
      } catch {
        /* */
      }
    })()
  }, [])

  const sendSchool = async (e: FormEvent) => {
    e.preventDefault()
    if (!roomId || !text.trim()) return
    const m = await chatApi.send({ room_id: roomId, content: text.trim() })
    setMessages((prev) => [...prev, m as Msg])
    setText('')
  }

  const sendBot = async (urgent = false) => {
    const content = urgent ? 'Мне нужна срочная поддержка' : text.trim()
    if (!content || busy) return
    setText('')
    setBotMsgs((m) => [...m, { content, role: 'user' }])
    setBusy(true)
    try {
      const r = await compassApi.chat(content, urgent)
      setBotMsgs((m) => [...m, { content: r.reply, role: 'assistant' }])
    } catch {
      setBotMsgs((m) => [
        ...m,
        {
          content: 'Сейчас связь с сервером недоступна. Горячая линия: +7 (495) 989-50-50. Экстренно: 112.',
          role: 'assistant',
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <section className="page-hero">
        <h1>Чат</h1>
        <p>Школьный чат, бот-психолог и челленджи. Школа: {profile?.school?.name ?? '—'}</p>
      </section>

      <div className="chip-row">
        <button type="button" className={`chip ${tab === 'school' ? 'active' : ''}`} onClick={() => setTab('school')}>
          Чат школы
        </button>
        <button type="button" className={`chip ${tab === 'bot' ? 'active' : ''}`} onClick={() => setTab('bot')}>
          Выговориться
        </button>
        <button
          type="button"
          className={`chip ${tab === 'challenges' ? 'active' : ''}`}
          onClick={() => setTab('challenges')}
        >
          Челленджи
        </button>
      </div>

      {tab === 'school' && (
        <div className="panel">
          <div style={{ maxHeight: 360, overflow: 'auto', display: 'grid', gap: 8 }}>
            {messages.map((m, i) => (
              <div key={i} className="hint" style={{ whiteSpace: 'pre-wrap' }}>
                <strong>{m.sender_name || 'Система'}:</strong> {m.content}
              </div>
            ))}
            {!messages.length && <p className="muted">Пока тихо — напишите первое сообщение.</p>}
          </div>
          <form onSubmit={(e) => void sendSchool(e)} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 12 }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение школе…" />
            <button className="btn" type="submit">
              Отправить
            </button>
          </form>
        </div>
      )}

      {tab === 'bot' && (
        <div className="panel">
          <div style={{ maxHeight: 360, overflow: 'auto', display: 'grid', gap: 8 }}>
            {botMsgs.map((m, i) => (
              <div
                key={i}
                style={{
                  justifySelf: m.role === 'user' ? 'end' : 'start',
                  maxWidth: '90%',
                  padding: '0.7rem 0.85rem',
                  borderRadius: 14,
                  background: m.role === 'user' ? 'rgba(112,58,20,0.12)' : '#fff',
                  border: '1px solid var(--line)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.content}
              </div>
            ))}
          </div>
          <div className="btn-row">
            <button type="button" className="btn danger" onClick={() => void sendBot(true)}>
              Тревога
            </button>
            <a className="btn secondary" href="tel:+74959895050">
              Позвонить в службу психологической помощи
            </a>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void sendBot(false)
            }}
            style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 8 }}
          >
            <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Что происходит…" />
            <button className="btn" type="submit" disabled={busy}>
              Отправить
            </button>
          </form>
        </div>
      )}

      {tab === 'challenges' && (
        <div className="panel">
          <div className="field">
            <label>Новый челлендж</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Неделя благодарности" />
          </div>
          <button
            type="button"
            className="btn"
            onClick={async () => {
              if (!title.trim()) return
              await chatApi.createChallenge({ title: title.trim(), days: 7 })
              setTitle('')
              setChallenges(await chatApi.challenges())
            }}
          >
            Создать
          </button>
          <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
            {challenges.map((c) => (
              <div key={c.id} className="panel">
                <strong>{c.title}</strong>
                <div className="muted">
                  Прогресс: {c.my_progress}/{c.days}
                </div>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={async () => {
                    await chatApi.tickChallenge(c.id)
                    setChallenges(await chatApi.challenges())
                  }}
                >
                  Отметить день
                </button>
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            Личные сообщения: откройте профиль друга в саду или используйте API to_user_id. Бот:{' '}
            <Link to="/chat">Выговориться</Link>.
          </p>
        </div>
      )}
    </div>
  )
}
