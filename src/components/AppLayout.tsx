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
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H9.2L5.5 19.5V15.5H5A1.5 1.5 0 0 1 3.5 14V7A1.5 1.5 0 0 1 5 5.5Z"
      />
    </svg>
  )
}

const bottom: { to: string; label: string; ico: ReactNode; end?: boolean }[] = [
  { to: '/app', label: 'Главная', ico: '⌂', end: true },
  { to: '/app/garden', label: 'Мой сад', ico: '❀' },
  { to: '/app/diary', label: 'Дневник', ico: '✎' },
  { to: '/app/chat', label: 'Чат', ico: <ChatNavIcon /> },
]

const desktop = [
  { to: '/app', label: 'Главная', end: true },
  { to: '/app/garden', label: 'Сад' },
  { to: '/app/diary', label: 'Дневник' },
  { to: '/app/chat', label: 'Чат' },
  { to: '/app/wheel', label: 'Баланс' },
  { to: '/app/affirmations', label: 'Аффирмации' },
  { to: '/app/cards', label: 'Карточки' },
  { to: '/app/resources', label: 'Банк' },
  { to: '/app/wish-map', label: 'Желания' },
  { to: '/app/settings', label: 'Настройки' },
]

export function AppLayout() {
  const { profile, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/app" className="brand">
          <div className="brand-mark">
            <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" width={40} height={40} />
          </div>
          <div className="brand-text">
            <strong>Ресурс</strong>
            <span>Поддержка педагога</span>
          </div>
        </NavLink>
        <div className="topbar-actions">
          <NavLink to="/app/settings" className="btn ghost install-btn">
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
              <NavLink to="/app/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
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
