import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { friendsApi, gardenApi, profileApi } from '../api/client'
import { useAuth } from '../auth/AuthContext'

const PLANT_ICON: Record<string, string> = {
  seed: '🌱',
  sprout: '🌿',
  flower: '🌸',
  tree: '🌳',
}

export function GardenPage() {
  const { profile, refresh } = useAuth()
  const [plants, setPlants] = useState<string[]>([])
  const [achievements, setAchievements] = useState<
    { id: string; title: string; description: string; earned: boolean }[]
  >([])
  const [friends, setFriends] = useState<{ user_id: number; full_name: string; streak: number; garden_plants: number }[]>(
    [],
  )
  const [invite, setInvite] = useState('')
  const [praises, setPraises] = useState<{ message: string; created_at: string }[]>([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const [g, a, f, p] = await Promise.all([
          gardenApi.me(),
          profileApi.achievements(),
          friendsApi.list(),
          profileApi.praises(),
        ])
        setPlants(g.plants)
        setAchievements(a)
        setFriends(f)
        setPraises(p)
      } catch {
        /* */
      }
    })()
  }, [profile?.points])

  const createInvite = async () => {
    const r = await friendsApi.invite()
    const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}${r.url_path}`
    setInvite(url)
    await navigator.clipboard?.writeText(url).catch(() => undefined)
    setMsg('Ссылка скопирована')
  }

  const water = async (id: number) => {
    try {
      await friendsApi.water(id)
      setMsg('Капля отправлена')
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  const shareProfile = async () => {
    if (!profile) return
    const url = `${window.location.origin}${import.meta.env.BASE_URL}share/${profile.share_token}`
    await navigator.clipboard?.writeText(url).catch(() => undefined)
    setMsg('Ссылка на профиль скопирована')
  }

  return (
    <div>
      <section className="page-hero">
        <h1>Мой сад</h1>
        <p>
          {profile?.full_name} · {profile?.school?.name ?? 'без школы'} · роль:{' '}
          {profile?.role === 'admin' ? 'администратор' : 'педагог'}
        </p>
      </section>

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <p>
          Уровень: <strong>{profile?.level}</strong> · Серия: <strong>{profile?.streak}</strong> · Очки:{' '}
          <strong>{profile?.points}</strong> · Растения: <strong>{profile?.garden_plants}</strong>
        </p>
        <div className="garden-grid">
          {(plants.length ? plants : Array.from({ length: Math.max(profile?.garden_plants ?? 0, 0) }, () => 'seed')).map(
            (p, i) => (
              <div key={i} className="plant" title={p}>
                {PLANT_ICON[p] || '🌱'}
              </div>
            ),
          )}
          {!plants.length && !(profile?.garden_plants) && (
            <p className="muted">Выполняйте карточки и дневник — сад начнёт расти.</p>
          )}
        </div>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => void shareProfile()}>
            Поделиться профилем
          </button>
          <button type="button" className="btn secondary" onClick={() => void createInvite()}>
            Пригласить друга
          </button>
          <Link className="btn ghost" to="/settings">
            Настройки
          </Link>
          {profile?.role === 'admin' && (
            <Link className="btn ghost" to="/admin">
              Панель администратора
            </Link>
          )}
        </div>
        {invite && <p className="muted">Инвайт: {invite}</p>}
        {msg && <p className="muted">{msg}</p>}
      </div>

      {praises.length > 0 && (
        <div className="panel" style={{ marginBottom: '1rem' }}>
          <h2 style={{ color: 'var(--brand)' }}>Похвалы</h2>
          {praises.map((p, i) => (
            <div key={i} className="hint">
              🌟 {p.message}
            </div>
          ))}
        </div>
      )}

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--brand)' }}>Ачивки</h2>
        <div className="achieve-grid">
          {achievements.map((a) => (
            <div key={a.id} className={`achieve-card ${a.earned ? '' : 'locked'}`} title={a.description}>
              <img src={`${import.meta.env.BASE_URL}achievements/${a.id}.svg`} alt="" width={56} height={56} />
              <div className="title">{a.title}</div>
            </div>
          ))}
        </div>
        {!achievements.some((a) => a.earned) && (
          <p className="muted" style={{ marginTop: 8 }}>
            Пока нет — начните с дневника или карточки.
          </p>
        )}
      </div>

      <div className="panel">
        <h2 style={{ color: 'var(--brand)' }}>Друзья</h2>
        {friends.map((f) => (
          <div key={f.user_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <div>
              <strong>{f.full_name}</strong>
              <div className="muted">
                серия {f.streak} · сад {f.garden_plants}
              </div>
            </div>
            <button type="button" className="btn ghost" onClick={() => void water(f.user_id)}>
              Полить
            </button>
          </div>
        ))}
        {!friends.length && <p className="muted">Пригласите коллегу — до 5 друзей.</p>}
      </div>
    </div>
  )
}
