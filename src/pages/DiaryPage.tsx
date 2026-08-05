import { useEffect, useMemo, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { diaryApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'

type Entry = {
  id: number
  entry_date: string
  mood: string
  gratitude: string
  reflection: string
  intention: string
}

function today() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function DiaryPage() {
  const { refresh } = useAuth()
  const [date, setDate] = useState(today())
  const [mood, setMood] = useState('neutral')
  const [gratitude, setGratitude] = useState('')
  const [reflection, setReflection] = useState('')
  const [intention, setIntention] = useState('')
  const [list, setList] = useState<Entry[]>([])
  const [showList, setShowList] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const timer = useRef<number | null>(null)

  const loadList = async () => {
    try {
      setList(await diaryApi.list())
    } catch {
      /* */
    }
  }

  useEffect(() => {
    void loadList()
  }, [])

  useEffect(() => {
    const e = list.find((x) => x.entry_date === date)
    setMood(e?.mood ?? 'neutral')
    setGratitude(e?.gratitude ?? '')
    setReflection(e?.reflection ?? '')
    setIntention(e?.intention ?? '')
  }, [date, list])

  const save = async () => {
    try {
      await diaryApi.upsert({ entry_date: date, mood, gratitude, reflection, intention })
      await loadList()
      await refresh()
    } catch {
      /* */
    }
  }

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      void save()
    }, 800)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, gratitude, reflection, intention, date])

  const filtered = useMemo(() => list, [list])

  return (
    <div>
      <section className="page-hero">
        <h1>Дневник</h1>
        <p>Заполняйте, когда чувствуете потребность. 2–3 раза в неделю достаточно.</p>
      </section>

      {!showList ? (
        <div className="panel">
          <div className="field">
            <label>Дата</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Настроение</label>
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
                  onClick={() => setMood(id)}
                >
                  {ico}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Благодарность</label>
            <textarea
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="Кому или за что я благодарен(на) сегодня?"
            />
          </div>
          <div className="field">
            <label>Моя минута рефлексии</label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Что получилось, что было трудно и ради чего? Всё в одном месте."
            />
          </div>
          <div className="field">
            <label>Что я хочу сделать?</label>
            <input
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="Завтра я хочу попробовать / обратить внимание на..."
            />
          </div>
          <p className="muted">
            Заполняйте дневник тогда, когда чувствуете потребность. Для поддержания ритуала рекомендуем 2–3 раза в
            неделю — этого достаточно, чтобы заметить динамику. Не обязательно каждый день, важнее регулярность без
            давления.
          </p>
          <div className="btn-row">
            <button type="button" className="btn secondary" onClick={() => setShowList(true)}>
              Перечитать записи
            </button>
          </div>
        </div>
      ) : (
        <div className="panel">
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button type="button" className="btn" onClick={() => setShowList(false)}>
              Назад к форме
            </button>
          </div>
          {filtered.map((e) => (
            <button
              key={e.id}
              type="button"
              className="panel"
              style={{ width: '100%', textAlign: 'left', marginTop: 8 }}
              onClick={() => setOpenId(openId === e.id ? null : e.id)}
            >
              <strong>{format(parseISO(e.entry_date), 'd MMMM yyyy', { locale: ru })}</strong>
              <div className="muted">
                {e.reflection.slice(0, 50) || e.gratitude.slice(0, 50) || '—'}
                {(e.reflection.length > 50 || e.gratitude.length > 50) && '…'}
              </div>
              {openId === e.id && (
                <div style={{ marginTop: 8, color: 'var(--ink)' }}>
                  <div>Настроение: {e.mood}</div>
                  <div>
                    <b>Благодарность:</b> {e.gratitude || '—'}
                  </div>
                  <div>
                    <b>Рефлексия:</b> {e.reflection || '—'}
                  </div>
                  <div>
                    <b>Намерение:</b> {e.intention || '—'}
                  </div>
                </div>
              )}
            </button>
          ))}
          {!filtered.length && <p className="muted">Записей пока нет.</p>}
        </div>
      )}
    </div>
  )
}
