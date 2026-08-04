import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, parseISO, subDays, isAfter, startOfYear } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAppStore } from '../store/useAppStore'
import { downloadHtmlPdf } from '../utils/pdf'

type Period = 'day' | 'week' | 'month' | 'year'

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

function wordCloud(texts: string[]) {
  const stop = new Set([
    'и', 'в', 'на', 'с', 'по', 'не', 'что', 'это', 'как', 'я', 'мне', 'для', 'а', 'но', 'к', 'из', 'у', 'о', 'же', 'бы', 'то', 'или', 'так', 'все', 'уже', 'был', 'была', 'были',
  ])
  const freq = new Map<string, number>()
  for (const t of texts) {
    for (const raw of t.toLowerCase().split(/[^а-яёa-z0-9]+/i)) {
      const w = raw.trim()
      if (w.length < 3 || stop.has(w)) continue
      freq.set(w, (freq.get(w) ?? 0) + 1)
    }
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)
}

export function DiaryPage() {
  const entries = useAppStore((s) => s.diaryEntries)
  const upsert = useAppStore((s) => s.upsertDiaryEntry)
  const [date, setDate] = useState(todayStr())
  const existing = entries.find((e) => e.date === date)
  const [mood, setMood] = useState(existing?.mood ?? 5)
  const [wins, setWins] = useState(existing?.wins ?? '')
  const [challenges, setChallenges] = useState(existing?.challenges ?? '')
  const [meanings, setMeanings] = useState(existing?.meanings ?? '')
  const [gratitude, setGratitude] = useState(existing?.gratitude ?? '')
  const [period, setPeriod] = useState<Period>('month')

  const loadDate = (d: string) => {
    setDate(d)
    const e = entries.find((x) => x.date === d)
    setMood(e?.mood ?? 5)
    setWins(e?.wins ?? '')
    setChallenges(e?.challenges ?? '')
    setMeanings(e?.meanings ?? '')
    setGratitude(e?.gratitude ?? '')
  }

  const filtered = useMemo(() => {
    const now = new Date()
    const from =
      period === 'day'
        ? subDays(now, 1)
        : period === 'week'
          ? subDays(now, 7)
          : period === 'month'
            ? subDays(now, 30)
            : startOfYear(now)
    return entries
      .filter((e) => isAfter(parseISO(e.date), from) || e.date === format(from, 'yyyy-MM-dd'))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [entries, period])

  const chartData = filtered.map((e) => ({
    date: format(parseISO(e.date), 'd MMM', { locale: ru }),
    mood: e.mood,
  }))

  const cloud = wordCloud(filtered.flatMap((e) => [e.wins, e.challenges, e.meanings, e.gratitude]))

  const save = () => {
    upsert({ id: existing?.id, date, mood, wins, challenges, meanings, gratitude })
  }

  const exportPdf = async () => {
    const rows = filtered
      .map(
        (e) => `<div style="border-bottom:1px solid #eee;padding:10px 0">
          <strong>${format(parseISO(e.date), 'd MMMM yyyy', { locale: ru })} · настроение ${e.mood}/10</strong>
          <div><b>Победы:</b> ${e.wins || '—'}</div>
          <div><b>Сложности:</b> ${e.challenges || '—'}</div>
          <div><b>Смыслы:</b> ${e.meanings || '—'}</div>
          <div><b>Благодарность:</b> ${e.gratitude || '—'}</div>
        </div>`,
      )
      .join('')
    await downloadHtmlPdf(
      `<div style="font-family:Manrope,Arial,sans-serif;color:#1c2421">
        <h1 style="color:#1a4a45;font-family:Georgia,serif">Дневник педагога-субъекта</h1>
        <p>Экспорт за период: ${period}</p>
        ${rows || '<p>Нет записей за выбранный период.</p>'}
      </div>`,
      `dnevnik-${period}.pdf`,
    )
  }

  return (
    <div>
      <section className="page-hero">
        <h1>Дневник педагога-субъекта</h1>
        <p>Ежедневная рефлексия: настроение, победы, сложности и смыслы. Статистика и PDF-экспорт.</p>
      </section>

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <div className="field">
          <label htmlFor="diary-date">Дата</label>
          <input id="diary-date" type="date" value={date} onChange={(e) => loadDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="mood">Настроение: {mood}/10</label>
          <input id="mood" type="range" min={1} max={10} value={mood} onChange={(e) => setMood(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="wins">Победы дня</label>
          <textarea id="wins" value={wins} onChange={(e) => setWins(e.target.value)} placeholder="Что получилось, даже мелочь" />
        </div>
        <div className="field">
          <label htmlFor="challenges">Сложности</label>
          <textarea id="challenges" value={challenges} onChange={(e) => setChallenges(e.target.value)} placeholder="Что было трудным" />
        </div>
        <div className="field">
          <label htmlFor="meanings">Смыслы</label>
          <textarea id="meanings" value={meanings} onChange={(e) => setMeanings(e.target.value)} placeholder="Ради чего / что это значит для меня" />
        </div>
        <div className="field">
          <label htmlFor="gratitude">Благодарность</label>
          <textarea id="gratitude" value={gratitude} onChange={(e) => setGratitude(e.target.value)} placeholder="Кому или за что благодарен(на)" />
        </div>
        <div className="btn-row">
          <button type="button" className="btn" onClick={save}>Сохранить запись</button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <div className="chip-row">
          {([
            ['day', 'День'],
            ['week', 'Неделя'],
            ['month', 'Месяц'],
            ['year', 'Год'],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" className={`chip ${period === id ? 'active' : ''}`} onClick={() => setPeriod(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className="btn-row">
          <button type="button" className="btn secondary" onClick={exportPdf}>Экспорт PDF</button>
        </div>
        <h2 style={{ color: 'var(--brand)', marginTop: '0.75rem' }}>График настроения</h2>
        <div style={{ height: 220 }}>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,36,33,0.08)" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis domain={[1, 10]} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="mood" stroke="#c47b3b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">Пока нет данных за период.</p>
          )}
        </div>
        <h2 style={{ color: 'var(--brand)', marginTop: '1rem' }}>Облако слов</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
          {cloud.length === 0 && <p className="muted">Напишите записи — здесь появятся частые слова.</p>}
          {cloud.map(([word, count]) => (
            <span
              key={word}
              style={{
                fontSize: `${0.85 + count * 0.2}rem`,
                color: count > 2 ? 'var(--brand)' : 'var(--ink-muted)',
                fontFamily: count > 2 ? 'var(--font-serif)' : 'inherit',
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
