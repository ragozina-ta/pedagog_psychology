import { useMemo, useRef } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { WHEEL_SPHERES } from '../data/wheel'
import { useAppStore } from '../store/useAppStore'
import type { WheelSphereId } from '../types'

const COLORS = ['#1a4a45', '#2f6b64', '#7d9b8a', '#c47b3b', '#e8b86d', '#5a6862', '#3d7a72', '#a67c52']

function polar(cx: number, cy: number, r: number, angle: number) {
  const a = (Math.PI / 180) * angle
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

export function WheelPage() {
  const values = useAppStore((s) => s.wheelCurrent)
  const history = useAppStore((s) => s.wheelHistory)
  const setWheelValue = useAppStore((s) => s.setWheelValue)
  const saveWheelSnapshot = useAppStore((s) => s.saveWheelSnapshot)
  const selectedRef = useRef<WheelSphereId>('meaning')

  const lowSpheres = WHEEL_SPHERES.filter((s) => values[s.id] < 4)

  const chartData = useMemo(
    () =>
      history.slice(-12).map((h) => ({
        date: format(new Date(h.date), 'd MMM', { locale: ru }),
        avg: Number(
          (Object.values(h.values).reduce((a, b) => a + b, 0) / 8).toFixed(1),
        ),
      })),
    [history],
  )

  const size = 320
  const cx = size / 2
  const cy = size / 2
  const maxR = 120
  const n = WHEEL_SPHERES.length

  const polygon = WHEEL_SPHERES.map((s, i) => {
    const angle = -90 + (360 / n) * i
    const r = (values[s.id] / 10) * maxR
    const p = polar(cx, cy, r, angle)
    return `${p.x},${p.y}`
  }).join(' ')

  return (
    <div>
      <section className="page-hero">
        <h1>Колесо баланса педагога</h1>
        <p>Оцените 8 сфер от 1 до 10. При значении ниже 4 появятся бережные подсказки.</p>
      </section>

      <div className="panel" style={{ display: 'grid', gap: '1.25rem', justifyItems: 'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Колесо баланса">
          {[2, 4, 6, 8, 10].map((lvl) => (
            <circle
              key={lvl}
              cx={cx}
              cy={cy}
              r={(lvl / 10) * maxR}
              fill="none"
              stroke="rgba(28,36,33,0.1)"
            />
          ))}
          {WHEEL_SPHERES.map((s, i) => {
            const angle = -90 + (360 / n) * i
            const outer = polar(cx, cy, maxR + 8, angle)
            const label = polar(cx, cy, maxR + 28, angle)
            return (
              <g key={s.id}>
                <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(28,36,33,0.12)" />
                <circle cx={polar(cx, cy, (values[s.id] / 10) * maxR, angle).x} cy={polar(cx, cy, (values[s.id] / 10) * maxR, angle).y} r={5} fill={COLORS[i]} />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fill="#1a4a45"
                >
                  {s.label.split(' ')[0]}
                </text>
              </g>
            )
          })}
          <polygon points={polygon} fill="rgba(47,107,100,0.28)" stroke="#1a4a45" strokeWidth="2" />
        </svg>

        <div style={{ width: '100%', display: 'grid', gap: '0.85rem' }}>
          {WHEEL_SPHERES.map((s, i) => (
            <div key={s.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <label htmlFor={s.id} style={{ fontWeight: 600, color: 'var(--brand)' }}>
                  <span style={{ color: COLORS[i] }}>●</span> {s.label}
                </label>
                <strong>{values[s.id]}</strong>
              </div>
              <input
                id={s.id}
                type="range"
                min={1}
                max={10}
                value={values[s.id]}
                onChange={(e) => {
                  selectedRef.current = s.id
                  setWheelValue(s.id, Number(e.target.value))
                }}
                style={{ width: '100%' }}
              />
            </div>
          ))}
        </div>

        <div className="btn-row" style={{ width: '100%' }}>
          <button type="button" className="btn" onClick={() => saveWheelSnapshot()}>
            Сохранить срез
          </button>
        </div>
      </div>

      {lowSpheres.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h2 style={{ color: 'var(--brand)' }}>Подсказки</h2>
          {lowSpheres.map((s) => (
            <div key={s.id} className="hint">
              <strong>{s.label} ({values[s.id]})</strong>
              <div>{s.hint}</div>
            </div>
          ))}
        </div>
      )}

      {chartData.length > 0 && (
        <div className="panel" style={{ marginTop: '1rem', height: 260 }}>
          <h2 style={{ color: 'var(--brand)', marginBottom: '0.75rem' }}>Динамика среднего балла</h2>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" stroke="#5a6862" fontSize={12} />
              <YAxis domain={[1, 10]} stroke="#5a6862" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="avg" stroke="#1a4a45" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
