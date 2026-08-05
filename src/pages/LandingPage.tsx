import { Link, Navigate } from 'react-router-dom'
import { InstallAppButton } from '../components/InstallAppButton'
import { usePwaInstall } from '../hooks/usePwaInstall'

export function LandingPage() {
  const { installed } = usePwaInstall()

  // Уже установленное приложение / standalone — сразу в веб-приложение
  if (installed) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="landing">
      <Link className="landing-web" to="/app">
        Веб версия
      </Link>

      <div className="landing-stage">
        <div className="landing-brand">
          <img
            className="landing-logo"
            src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
            alt=""
            width={88}
            height={88}
          />
          <h1 className="landing-title">Ресурс</h1>
          <p className="landing-lead">Поддержка педагога — баланс, дневник и сад в одном приложении</p>
        </div>

        <div className="landing-cta">
          <InstallAppButton className="btn landing-download" label="Скачать приложение" />
        </div>
      </div>
    </div>
  )
}
