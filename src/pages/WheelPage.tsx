import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { wheelApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { WHEEL_SPHERES } from '../data/wheel'
import { cardsForCategories } from '../data/cards'
import type { WheelSphereId } from '../types'

const COLORS = ['#703a14', '#a46957', '#c18636', '#31464f', '#ecd09c', '#8b5a2b', '#5c6b52', '#9c5a4a']

const INTRO = `Это колесо — не экзамен, не отчёт и не проверка.
Оно для вас, чтобы увидеть, куда уходят силы и что можно мягко скорректировать.

Как заполнять:
· Оцените каждую сферу по шкале от 0 до 10, где 0 — совсем не устраивает, 10 — полностью удовлетворяет.
· Отвечайте быстро, не задумываясь — первое ощущение самое честное.

Что будет дальше:
· Сразу после заполнения вы увидите свой «слепок» состояния.
· Мы подскажем, где вы сильны, и предложим не более 3 микро-шагов в тех зонах, где захотите что-то изменить.

Важно:
Нет «правильного» результата — есть только ваше текущее состояние.
Баланс — про гибкость, а не про идеальность.

Заполнение займёт около 2 минут.`

function defaultValues(): Record<WheelSphereId, number> {
  return Object.fromEntries(WHEEL_SPHERES.map((s) => [s.id, 5])) as Record<WheelSphereId, number>
}

export function WheelPage() {
  const { refresh } = useAuth()
  const [step, setStep] = useState<'intro' | 'fill' | 'result'>('intro')
  const [values, setValues] = useState<Record<WheelSphereId, number>>(defaultValues)
  const [saveMsg, setSaveMsg] = useState('')
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const hist = await wheelApi.history()
        const last = hist[0]
        if (!last?.values) return
        const next = defaultValues()
        for (const s of WHEEL_SPHERES) {
          const v = last.values[s.id]
          if (typeof v === 'number') next[s.id] = Math.max(0, Math.min(10, v))
        }
        setValues(next)
        setLastSaved(last.created_at)
      } catch {
        /* */
      }
    })()
  }, [])

  const size = 320
  const cx = size / 2
  const cy = size / 2
  const outerR = 130
  const n = WHEEL_SPHERES.length

  const sectors = useMemo(() => {
    return WHEEL_SPHERES.map((s, i) => {
      const start = -90 + (360 / n) * i
      const end = start + 360 / n
      const val = values[s.id]
      const rings = []
      for (let lvl = 1; lvl <= 10; lvl++) {
        const r0 = (outerR / 10) * (lvl - 1)
        const r1 = (outerR / 10) * lvl
        rings.push({ lvl, r0, r1, filled: lvl <= val })
      }
      return { sphere: s, i, start, end, rings, color: COLORS[i] }
    })
  }, [values])

  function polar(r: number, angle: number) {
    const a = (Math.PI / 180) * angle
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  }

  function arcPath(r0: number, r1: number, start: number, end: number) {
    const p1 = polar(r1, start)
    const p2 = polar(r1, end)
    const p3 = polar(r0, end)
    const p4 = polar(r0, start)
    const large = end - start > 180 ? 1 : 0
    return `M ${p1.x} ${p1.y} A ${r1} ${r1} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${r0} ${r0} 0 ${large} 0 ${p4.x} ${p4.y} Z`
  }

  const low = WHEEL_SPHERES.filter((s) => values[s.id] < 5)
  const strong = WHEEL_SPHERES.filter((s) => values[s.id] >= 7)
  const tipCards = cardsForCategories(
    low.slice(0, 3).map((s) => {
      const map: Record<string, string> = {
        rest: 'Ресурс',
        health: 'Тело',
        children: 'Контакт',
        support: 'Поддержка',
        meaning: 'Смысл',
        growth: 'Мышление',
        family: 'Принятие',
        finance: 'Границы',
      }
      return map[s.id] || 'Ресурс'
    }),
    3,
  )

  const finish = async () => {
    setSaveMsg('Сохраняем…')
    try {
      await wheelApi.save(values)
      await refresh()
      const now = new Date().toISOString()
      setLastSaved(now)
      setSaveMsg('Слепок сохранён')
      setStep('result')
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : 'Не удалось сохранить')
    }
  }

  if (step === 'intro') {
    return (
      <div>
        <section className="page-hero">
          <h1>Колесо баланса педагога</h1>
          <p>
            Колесо названо так, потому что оно показывает движение: если одна сфера «проседает», колесо перестаёт
            катиться ровно — и это сразу видно.
          </p>
        </section>
        <div className="panel">
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--ink-muted)', margin: 0 }}>
            {INTRO}
          </pre>
          {lastSaved && (
            <p className="muted" style={{ marginTop: 12 }}>
              Последний слепок:{' '}
              {format(parseISO(lastSaved), 'd MMMM yyyy, HH:mm', { locale: ru })}
            </p>
          )}
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => setStep('fill')}>
              Начать заполнение
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <section className="page-hero">
        <h1>Колесо баланса</h1>
        <p>8 секторов, каждый из 10 частей. Ползунок закрашивает сегменты сектора.</p>
      </section>

      <div className="panel" style={{ textAlign: 'center' }}>
        {lastSaved && (
          <p className="muted" style={{ marginTop: 0 }}>
            Сохранено: {format(parseISO(lastSaved), 'd MMMM yyyy, HH:mm', { locale: ru })}
          </p>
        )}
        <svg className="sector-wheel" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Колесо баланса">
          {sectors.map((sec) =>
            sec.rings.map((ring) => (
              <path
                key={`${sec.sphere.id}-${ring.lvl}`}
                d={arcPath(ring.r0 + 1, ring.r1, sec.start + 1, sec.end - 1)}
                fill={ring.filled ? sec.color : 'rgba(49,70,79,0.06)'}
                stroke="rgba(247,241,230,0.8)"
                strokeWidth={0.8}
                opacity={ring.filled ? 0.9 : 0.5}
              />
            )),
          )}
          <circle cx={cx} cy={cy} r={18} fill="#f7f1e6" stroke="#703a14" />
        </svg>

        <div style={{ textAlign: 'left', marginTop: 16 }}>
          {WHEEL_SPHERES.map((s, i) => (
            <div key={s.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontWeight: 600, color: 'var(--brand)' }}>
                  <span style={{ color: COLORS[i] }}>●</span> {s.label}
                </label>
                <strong>{values[s.id]}</strong>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={values[s.id]}
                onChange={(e) => setValues((v) => ({ ...v, [s.id]: Number(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
          ))}
        </div>

        {step === 'fill' && (
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => void finish()}>
              Сохранить слепок
            </button>
          </div>
        )}
        {saveMsg && <p className="muted">{saveMsg}</p>}
      </div>

      {step === 'result' && (
        <div className="panel" style={{ marginTop: '1rem' }}>
          <h2 style={{ color: 'var(--brand)' }}>Спасибо, что нашли время для себя</h2>
          <p>
            Вы сильны в сферах, где поставили 7 и выше — это ваши опоры
            {strong.length ? `: ${strong.map((s) => s.label).join(', ')}` : ''}.
          </p>
          <p>
            Сферы с оценкой ниже 5 — не провалы, а точки роста
            {low.length ? `: ${low.map((s) => s.label).join(', ')}` : ''}.
          </p>
          {tipCards.length > 0 && (
            <>
              <h3 style={{ color: 'var(--brand)' }}>3 карточки дня</h3>
              {tipCards.map((c) => (
                <div key={c.id} className="hint">
                  <strong>{c.title}</strong> — {c.task}
                </div>
              ))}
              <Link className="btn secondary" to="/cards">
                К колоде карточек
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
