import { NavLink, Outlet } from 'react-router-dom'
import { InstallAppButton } from './InstallAppButton'

const links = [
  { to: '/', label: 'Главная', ico: '⌂', end: true },
  { to: '/wheel', label: 'Баланс', ico: '◎' },
  { to: '/diary', label: 'Дневник', ico: '✎' },
  { to: '/compass', label: 'Компас', ico: '◈' },
]

const allLinks = [
  { to: '/', label: 'Главная', end: true },
  { to: '/wheel', label: 'Баланс' },
  { to: '/wish-map', label: 'Желания' },
  { to: '/cards', label: 'Карточки' },
  { to: '/diary', label: 'Дневник' },
  { to: '/compass', label: 'Компас' },
  { to: '/affirmations', label: 'Аффирмации' },
  { to: '/resources', label: 'Банк' },
  { to: '/settings', label: 'Настройки' },
]

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <div className="brand-mark">Р</div>
          <div className="brand-text">
            <strong>Ресурс</strong>
            <span>пространство заботы о педагоге</span>
          </div>
        </NavLink>
        <div className="topbar-actions">
          <InstallAppButton className="btn install-btn" label="Скачать" />
          <nav className="desktop-nav">
            {allLinks.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="ico">{l.ico}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
