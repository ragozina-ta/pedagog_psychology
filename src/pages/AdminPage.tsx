import { useEffect, useState } from 'react'
import { getToken, adminApi, API_URL } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Navigate } from 'react-router-dom'

export function AdminPage() {
  const { profile } = useAuth()
  const [teachers, setTeachers] = useState<
    {
      user_id: number
      full_name: string
      streak: number
      points: number
      garden_plants: number
      achievements_count: number
      last_activity_date: string | null
    }[]
  >([])
  const [stats, setStats] = useState<{ active_users: number; total_members: number; by_kind: Record<string, number> } | null>(
    null,
  )
  const [msg, setMsg] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        setTeachers(await adminApi.teachers())
        setStats(await adminApi.stats())
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Ошибка')
      }
    })()
  }, [])

  if (profile && profile.role !== 'admin') return <Navigate to="/garden" replace />

  const downloadReport = async () => {
    const res = await fetch(adminApi.reportUrl(), {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'school-report.txt'
    a.click()
  }

  return (
    <div>
      <section className="page-hero">
        <h1>Панель администратора</h1>
        <p>
          Школа: {profile?.school?.name} · код: <strong>{profile?.school?.invite_code}</strong>
        </p>
      </section>

      {stats && (
        <div className="panel" style={{ marginBottom: '1rem' }}>
          <p>
            Активных за месяц: <strong>{stats.active_users}</strong> из {stats.total_members}
          </p>
          <div className="chip-row">
            {Object.entries(stats.by_kind).map(([k, v]) => (
              <span key={k} className="chip active">
                {k}: {v}
              </span>
            ))}
          </div>
          <button type="button" className="btn secondary" onClick={() => void downloadReport()}>
            Скачать отчёт
          </button>
        </div>
      )}

      <div className="panel">
        <h2 style={{ color: 'var(--brand)' }}>Рейтинг педагогов</h2>
        {teachers.map((t, i) => (
          <div
            key={t.user_id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 8,
              padding: '0.75rem 0',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div>
              <strong>
                {i + 1}. {t.full_name}
              </strong>
              <div className="muted">
                очки {t.points} · серия {t.streak} · сад {t.garden_plants} · ачивки {t.achievements_count}
                {t.last_activity_date ? ` · был(а) ${t.last_activity_date}` : ' · давно не заходил(а)'}
              </div>
            </div>
            <button
              type="button"
              className="btn ghost"
              onClick={async () => {
                await adminApi.praise(t.user_id, `Отмечен прогресс: серия ${t.streak} дней`)
                setMsg(`Похвала отправлена: ${t.full_name}`)
              }}
            >
              Похвала
            </button>
          </div>
        ))}
        {msg && <p className="muted">{msg}</p>}
        {/* silence unused */}
        <span style={{ display: 'none' }}>{API_URL}</span>
      </div>
    </div>
  )
}
