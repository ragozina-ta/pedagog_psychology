import { useEffect, useMemo, useState } from 'react'
import { format, parseISO, subDays, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
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

const STOP = new Set([
  'и',
  'в',
  'на',
  'с',
  'по',
  'для',
  'не',
  'что',
  'как',
  'это',
  'я',
  'мне',
  'мой',
  'моя',
  'мои',
  'а',
  'но',
  'или',
  'к',
  'из',
  'у',
  'о',
  'от',
  'за',
  'то',
  'так',
  'же',
  'бы',
  'был',
  'была',
  'было',
  'быть',
  'есть',
  'когда',
  'уже',
  'ещё',
  'еще',
  'очень',
  'просто',
  'сегодня',
  'завтра',
  'хочу',
  'могу',
])

function today() {
  return format(new Date(), 'yyyy-MM-dd')
}

function normalizeMood(raw: string | undefined): number {
  if (!raw) return 5
  if (raw === 'happy') return 8
  if (raw === 'neutral') return 5
  if (raw === 'sad') return 2
  const n = Number(raw)
  if (Number.isFinite(n)) return Math.max(0, Math.min(10, Math.round(n)))
  return 5
}

function entriesLastWeek(entries: Entry[]) {
  const cutoff = startOfDay(subDays(new Date(), 6))
  return entries.filter((e) => {
    try {
      return parseISO(e.entry_date) >= cutoff
    } catch {
      return false
    }
  })
}

function buildWordCloud(entries: Entry[]) {
  const counts = new Map<string, number>()
  for (const e of entries) {
    const text = `${e.gratitude} ${e.reflection} ${e.intention}`.toLowerCase()
    for (const raw of text.split(/[^а-яёa-z0-9]+/i)) {
      const w = raw.trim()
      if (w.length < 3 || STOP.has(w)) continue
      counts.set(w, (counts.get(w) || 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }))
}

export function DiaryPage() {
  const { refresh } = useAuth()
  const [date, setDate] = useState(today())
  const [mood, setMood] = useState(5)
  const [gratitude, setGratitude] = useState('')
  const [reflection, setReflection] = useState('')
  const [intention, setIntention] = useState('')
  const [list, setList] = useState<Entry[]>([])
  const [showList, setShowList] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

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

  const clearForm = () => {
    setMood(5)
    setGratitude('')
    setReflection('')
    setIntention('')
  }

  const save = async () => {
    setSaving(true)
    setStatus('Сохраняем…')
    try {
      await diaryApi.upsert({
        entry_date: date,
        mood: String(mood),
        gratitude,
        reflection,
        intention,
      })
      clearForm()
      await loadList()
      await refresh()
      setStatus('Сохранено')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const chartData = useMemo(
    () =>
      [...list]
        .sort((a, b) => a.entry_date.localeCompare(b.entry_date) || a.id - b.id)
        .map((e) => ({
          date: format(parseISO(e.entry_date), 'd MMM', { locale: ru }),
          mood: normalizeMood(e.mood),
        })),
    [list],
  )

  const words = useMemo(() => buildWordCloud(entriesLastWeek(list)), [list])
  const maxCount = words[0]?.count ?? 1

  return (
    <div>
      <section className="page-hero">
        <h1>Дневник</h1>
        <p>Заполняйте, когда чувствуете потребность. 2–3 раза в неделю достаточно.</p>
      </section>

      {!showList ? (
        <>
          <div className="panel">
            <div className="field">
              <label>Дата</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Настроение: {mood}/10</label>
              <input
                className="mood-slider"
                type="range"
                min={0}
                max={10}
                value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
              />
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
              неделю — этого достаточно, чтобы заметить динамику. В один день можно сохранить несколько записей.
            </p>
            <div className="btn-row">
              <button type="button" className="btn" disabled={saving} onClick={() => void save()}>
                Сохранить
              </button>
              <button type="button" className="btn secondary" onClick={() => setShowList(true)}>
                Перечитать записи
              </button>
            </div>
            {status && <p className="muted">{status}</p>}
          </div>

          {chartData.length > 0 && (
            <div className="panel" style={{ marginTop: '1rem' }}>
              <h2 style={{ color: 'var(--brand)', fontSize: '1.1rem' }}>Динамика настроения</h2>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(49,70,79,0.15)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} width={28} />
                    <Tooltip />
                    <Line type="monotone" dataKey="mood" stroke="#703a14" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {words.length > 0 && (
            <div className="panel" style={{ marginTop: '1rem' }}>
              <h2 style={{ color: 'var(--brand)', fontSize: '1.1rem' }}>Облако слов за неделю</h2>
              <div className="word-cloud">
                {words.map(({ word, count }) => (
                  <span key={word} style={{ fontSize: `${0.75 + (count / maxCount) * 1.1}rem` }}>
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="panel">
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button type="button" className="btn" onClick={() => setShowList(false)}>
              Назад к форме
            </button>
          </div>
          {list.map((e) => (
            <button
              key={e.id}
              type="button"
              className="panel"
              style={{ width: '100%', textAlign: 'left', marginTop: 8 }}
              onClick={() => setOpenId(openId === e.id ? null : e.id)}
            >
              <strong>{format(parseISO(e.entry_date), 'd MMMM yyyy', { locale: ru })}</strong>
              <div className="muted">
                Настроение {normalizeMood(e.mood)}/10 · {e.reflection.slice(0, 50) || e.gratitude.slice(0, 50) || '—'}
                {(e.reflection.length > 50 || e.gratitude.length > 50) && '…'}
              </div>
              {openId === e.id && (
                <div style={{ marginTop: 8, color: 'var(--ink)' }}>
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
          {!list.length && <p className="muted">Записей пока нет.</p>}
        </div>
      )}
    </div>
  )
}
