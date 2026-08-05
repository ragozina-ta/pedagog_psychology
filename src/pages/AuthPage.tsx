import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

/** Demo credentials (frontend-only). */
const TEST_ACCOUNT = {
  email: 'test@test.com',
  password: '123456',
  full_name: 'Тестовый педагог',
}

export function AuthPage() {
  const { login, register } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const enterApp = async (doLogin: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await doLogin()
      nav('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await enterApp(async () => {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register({
          email,
          password,
          full_name: fullName,
        })
      }
    })
  }

  const onTestMode = async () => {
    setEmail(TEST_ACCOUNT.email)
    setPassword(TEST_ACCOUNT.password)
    await enterApp(async () => {
      try {
        await login(TEST_ACCOUNT.email, TEST_ACCOUNT.password)
      } catch {
        // First run: create the demo account, then enter
        await register({
          email: TEST_ACCOUNT.email,
          password: TEST_ACCOUNT.password,
          full_name: TEST_ACCOUNT.full_name,
        })
      }
    })
  }

  return (
    <div className="auth-card panel">
      <h1 style={{ color: 'var(--brand)' }}>Ресурс</h1>
      <p>Поддержка педагога</p>
      <div className="chip-row">
        <button type="button" className={`chip ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
          Вход
        </button>
        <button
          type="button"
          className={`chip ${mode === 'register' ? 'active' : ''}`}
          onClick={() => setMode('register')}
        >
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
          <input
            type="text"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {error && <div className="hint">{error}</div>}
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? '…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
          <button type="button" className="btn secondary" disabled={busy} onClick={() => void onTestMode()}>
            Тестовый режим
          </button>
        </div>
      </form>
    </div>
  )
}
