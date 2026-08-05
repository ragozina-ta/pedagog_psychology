import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { AutoPushSubscribe } from './AutoPushSubscribe'
import { InstallAppButton } from './InstallAppButton'
import { useAuth } from '../auth/AuthContext'

/** Монохромная иконка чата (эмодзи ✉/💬 на телефонах рисуются белыми/цветными). */
function ChatNavIcon() {
  return (
    <svg className="ico ico-svg" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M4.5 3.75h15a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25H9.6l-3.72 3.1a.75.75 0 0 1-1.23-.57V17.25H4.5A2.25 2.25 0 0 1 2.25 15V6A2.25 2.25 0 0 1 4.5 3.75Z"
      />
    </svg>
  )
}

const bottom: { to: string; label: string; ico: ReactNode; end?: boolean }[] = [
  { to: '/', label: 'Главная', ico: '⌂', end: true },
  { to: '/garden', label: 'Мой сад', ico: '❀' },
  { to: '/diary', label: 'Дневник', ico: '✎' },
  { to: '/chat', label: 'Чат', ico: <ChatNavIcon /> },
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
            {typeof l.ico === 'string' ? <span className="ico">{l.ico}</span> : l.ico}
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
