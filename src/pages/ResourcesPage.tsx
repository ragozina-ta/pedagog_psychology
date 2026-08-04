import { useMemo, useState } from 'react'
import { RESOURCES, RESOURCE_CATEGORIES } from '../data/resources'
import type { ResourceItem } from '../types'

export function ResourcesPage() {
  const [category, setCategory] = useState<ResourceItem['category'] | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>(RESOURCES[0]?.id ?? null)

  const list = useMemo(
    () => (category === 'all' ? RESOURCES : RESOURCES.filter((r) => r.category === category)),
    [category],
  )
  const open = list.find((r) => r.id === openId) ?? list[0]

  return (
    <div>
      <section className="page-hero">
        <h1>Ресурсный банк</h1>
        <p>Техники самовосстановления, скрипты для родителей, методические идеи и медитации.</p>
      </section>

      <div className="chip-row">
        <button type="button" className={`chip ${category === 'all' ? 'active' : ''}`} onClick={() => setCategory('all')}>
          Все
        </button>
        {(Object.keys(RESOURCE_CATEGORIES) as ResourceItem['category'][]).map((c) => (
          <button
            key={c}
            type="button"
            className={`chip ${category === c ? 'active' : ''}`}
            onClick={() => {
              setCategory(c)
              const first = RESOURCES.find((r) => r.category === c)
              if (first) setOpenId(first.id)
            }}
          >
            {RESOURCE_CATEGORIES[c]}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div style={{ display: 'grid', gap: '0.6rem', alignContent: 'start' }}>
          {list.map((r) => (
            <button
              key={r.id}
              type="button"
              className="panel"
              onClick={() => setOpenId(r.id)}
              style={{
                textAlign: 'left',
                borderColor: open?.id === r.id ? 'rgba(26,74,69,0.35)' : undefined,
                background: open?.id === r.id ? 'rgba(26,74,69,0.06)' : undefined,
              }}
            >
              <div className="muted" style={{ fontSize: '0.75rem' }}>
                {RESOURCE_CATEGORIES[r.category]}
                {r.duration ? ` · ${r.duration}` : ''}
              </div>
              <strong style={{ color: 'var(--brand)' }}>{r.title}</strong>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem' }}>{r.summary}</p>
            </button>
          ))}
        </div>

        {open && (
          <div className="panel">
            <div className="muted" style={{ fontSize: '0.75rem', marginBottom: 8 }}>
              {RESOURCE_CATEGORIES[open.category]}
              {open.duration ? ` · ${open.duration}` : ''}
            </div>
            <h2 style={{ color: 'var(--brand)' }}>{open.title}</h2>
            <p style={{ color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{open.body}</p>
          </div>
        )}
      </div>
    </div>
  )
}
