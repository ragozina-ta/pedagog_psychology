import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { friendsApi, profileApi, type Profile } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export function InvitePage() {
  const { token } = useParams()
  const { profile, refresh } = useAuth()
  const [msg, setMsg] = useState('Принятие приглашения…')

  useEffect(() => {
    if (!token || !profile) {
      setMsg('Войдите в аккаунт, затем откройте эту ссылку снова.')
      return
    }
    void (async () => {
      try {
                const f = await friendsApi.accept(token)
        setMsg(`Теперь вы друзья с ${f.full_name}`)
        await refresh()
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Ошибка')
      }
    })()
  }, [token, profile, refresh])

  return (
    <div className="panel">
      <h1 style={{ color: 'var(--brand)' }}>Приглашение</h1>
      <p>{msg}</p>
      <Link className="btn" to="/garden">
        В сад
      </Link>
    </div>
  )
}

export function SharePage() {
  const { token } = useParams()
  const [p, setP] = useState<Profile | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!token) return
    void profileApi
      .shared(token)
      .then(setP)
      .catch((e) => setErr(e instanceof Error ? e.message : 'Ошибка'))
  }, [token])

  if (err) return <div className="panel">{err}</div>
  if (!p) return <div className="panel">Загрузка…</div>

  return (
    <div className="panel">
      <h1 style={{ color: 'var(--brand)' }}>{p.full_name}</h1>
      <p>
        Уровень {p.level} · серия {p.streak} · очки {p.points} · сад {p.garden_plants}
      </p>
      <p className="muted">{p.school?.name}</p>
      <Link className="btn secondary" to="/">
        В Ресурс
      </Link>
    </div>
  )
}
