import { NavLink, Outlet } from 'react-router-dom'
import { AutoPushSubscribe } from './AutoPushSubscribe'
import { InstallAppButton } from './InstallAppButton'
import { useAuth } from '../auth/AuthContext'

const bottom = [
  { to: '/', label: 'Главная', ico: '⌂', end: true },
  { to: '/garden', label: 'Мой сад', ico: '❀' },
  { to: '/diary', label: 'Дневник', ico: '✎' },
  { to: '/chat', label: 'Чат', ico: '✉' },
]

const desktop = [
  { to: '/', label: 'Главная', end: true },
  { to: '/garden', label: 'Сад' },
  { to: '/diary', label: 'Дневник' },
  { to: '/chat', label: 'Чат' },
  { to: '/wheel', label: 'Баланс' },
  { to: '/affirmations', label: 'Аффирмации' },
  { to: '/cards', label: 'Карточки' },
  { to: '/resources', label: 'Банк' },
  { to: '/wish-map', label: 'Желания' },
  { to: '/settings', label: 'Настройки' },
]

export function AppLayout() {
  const { profile, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <div className="brand-mark">
            <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" width={40} height={40} />
          </div>
          <div className="brand-text">
            <strong>Ресурс</strong>
            <span>Поддержка педагога</span>
          </div>
        </NavLink>
        <div className="topbar-actions">
          <NavLink to="/settings" className="btn ghost install-btn">
            Настройки
          </NavLink>
          <InstallAppButton className="btn install-btn" label="Скачать" />
          {profile && (
            <button type="button" className="btn ghost install-btn" onClick={logout}>
              Выйти
            </button>
          )}
          <nav className="desktop-nav">
            {desktop.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            ))}
            {profile?.role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
                Админ
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="main">
        <AutoPushSubscribe />
        <Outlet />
      </main>
      <nav className="bottom-nav">
        {bottom.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="ico">{l.ico}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
