import { useMemo, useState } from 'react'
import { activityApi, profileApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { RESOURCES, RESOURCE_CATEGORIES } from '../data/resources'
import type { ResourceItem } from '../data/resources'

export function ResourcesPage() {
  const { profile, refresh } = useAuth()
  const [category, setCategory] = useState<ResourceItem['category'] | 'all'>('all')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string>(RESOURCES[0].id)
  const favs = profile?.favorite_resources ?? []

  const list = useMemo(() => {
    let rows = category === 'all' ? RESOURCES : RESOURCES.filter((r) => r.category === category)
    if (q.trim()) {
      const s = q.toLowerCase()
      rows = rows.filter((r) => r.title.toLowerCase().includes(s) || r.body.toLowerCase().includes(s) || r.summary.toLowerCase().includes(s))
    }
    return rows
  }, [category, q])

  const open = list.find((r) => r.id === openId) ?? list[0]

  const toggleFav = async (id: string) => {
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id]
    await profileApi.update({ favorite_resources: next })
    await refresh()
  }

  const helped = async (id: string) => {
    await activityApi.log('resource', { id })
    await refresh()
  }

  return (
    <div>
      <section className="page-hero">
        <h1>Ресурсный банк</h1>
        <p>Техники, скрипты, методики и медитации. Поиск и избранное.</p>
      </section>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Поиск…"
        style={{ width: '100%', marginBottom: 12, padding: '0.7rem', borderRadius: 12, border: '1px solid var(--line)' }}
      />
      <div className="chip-row">
        <button type="button" className={`chip ${category === 'all' ? 'active' : ''}`} onClick={() => setCategory('all')}>
          Все
        </button>
        {(Object.keys(RESOURCE_CATEGORIES) as ResourceItem['category'][]).map((c) => (
          <button key={c} type="button" className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            {RESOURCE_CATEGORIES[c]}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div style={{ display: 'grid', gap: '0.55rem' }}>
          {list.map((r) => (
            <button key={r.id} type="button" className="panel" style={{ textAlign: 'left' }} onClick={() => setOpenId(r.id)}>
              <div className="muted" style={{ fontSize: '0.75rem' }}>
                {RESOURCE_CATEGORIES[r.category]}
                {favs.includes(r.id) ? ' · ★' : ''}
              </div>
              <strong style={{ color: 'var(--brand)' }}>{r.title}</strong>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.9rem' }}>{r.summary}</p>
            </button>
          ))}
        </div>
        {open && (
          <div className="panel">
            <h2 style={{ color: 'var(--brand)' }}>{open.title}</h2>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>{open.body}</p>
            <div className="btn-row">
              <button type="button" className="btn ghost" onClick={() => void toggleFav(open.id)}>
                {favs.includes(open.id) ? 'В избранном' : 'В избранное'}
              </button>
              <button type="button" className="btn secondary" onClick={() => void helped(open.id)}>
                Помогло
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
