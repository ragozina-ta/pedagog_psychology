import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AuthPage() {
  const { login, register } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [asAdmin, setAsAdmin] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register({
          email,
          password,
          full_name: fullName,
          school_code: asAdmin ? undefined : schoolCode,
          create_school_name: asAdmin ? schoolName : undefined,
        })
      }
      nav('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-card panel">
      <h1 style={{ color: 'var(--brand)' }}>Ресурс</h1>
      <p>Пространство заботы о педагоге</p>
      <div className="chip-row">
        <button type="button" className={`chip ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
          Вход
        </button>
        <button type="button" className={`chip ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
          Регистрация
        </button>
      </div>
      <form onSubmit={(e) => void onSubmit(e)}>
        {mode === 'register' && (
          <div className="field">
            <label>Имя</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
        )}
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Пароль</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        {mode === 'register' && (
          <>
            <label className="muted" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <input type="checkbox" checked={asAdmin} onChange={(e) => setAsAdmin(e.target.checked)} />
              Создаю школу (роль администратора)
            </label>
            {asAdmin ? (
              <div className="field">
                <label>Название школы</label>
                <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required />
              </div>
            ) : (
              <div className="field">
                <label>Код приглашения школы</label>
                <input value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} required />
              </div>
            )}
          </>
        )}
        {error && <div className="hint">{error}</div>}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? '…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 12 }}>
        <Link to="/share/demo">Публичный профиль</Link> доступен по ссылке-токену после входа.
      </p>
    </div>
  )
}
