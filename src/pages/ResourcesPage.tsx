import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { activityApi, profileApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { RESOURCES, RESOURCE_CATEGORIES } from '../data/resources'
import type { ResourceItem } from '../data/resources'

export function ResourcesPage() {
  const { profile, refresh } = useAuth()
  const [searchParams] = useSearchParams()
  const [category, setCategory] = useState<ResourceItem['category'] | 'all'>('all')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const favs = profile?.favorite_resources ?? []

  useEffect(() => {
    const open = searchParams.get('open')
    if (!open) return
    const item = RESOURCES.find((r) => r.id === open)
    if (!item) return
    setCategory('all')
    setOpenId(item.id)
  }, [searchParams])

  const list = useMemo(() => {
    let rows = category === 'all' ? RESOURCES : RESOURCES.filter((r) => r.category === category)
    if (q.trim()) {
      const s = q.toLowerCase()
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(s) ||
          r.body.toLowerCase().includes(s) ||
          r.summary.toLowerCase().includes(s),
      )
    }
    return rows
  }, [category, q])

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
          <button
            key={c}
            type="button"
            className={`chip ${category === c ? 'active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {RESOURCE_CATEGORIES[c]}
          </button>
        ))}
      </div>
      <div className="resource-acc">
        {list.map((r) => {
          const open = openId === r.id
          return (
            <div key={r.id} className="resource-acc__item">
              <button
                type="button"
                className="resource-acc__head"
                onClick={() => setOpenId(open ? null : r.id)}
                aria-expanded={open}
              >
                <div className="muted" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  {RESOURCE_CATEGORIES[r.category]}
                  {favs.includes(r.id) ? ' · ★' : ''}
                </div>
                {r.title}
                {!open && (
                  <div className="muted" style={{ fontWeight: 400, marginTop: 4 }}>
                    {r.summary}
                  </div>
                )}
              </button>
              {open && (
                <div className="resource-acc__body">
                  <p style={{ whiteSpace: 'pre-wrap', margin: '0.75rem 0' }}>{r.body}</p>
                  <div className="btn-row" style={{ marginTop: 0 }}>
                    <button type="button" className="btn ghost" onClick={() => void toggleFav(r.id)}>
                      {favs.includes(r.id) ? 'В избранном' : 'В избранное'}
                    </button>
                    <button type="button" className="btn secondary" onClick={() => void helped(r.id)}>
                      Помогло
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {!list.length && <p className="muted">Ничего не найдено.</p>}
      </div>
    </div>
  )
}
