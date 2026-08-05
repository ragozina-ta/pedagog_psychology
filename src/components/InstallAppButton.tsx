import { useState } from 'react'
import { usePwaInstall } from '../hooks/usePwaInstall'

interface InstallAppButtonProps {
  className?: string
  label?: string
}

export function InstallAppButton({ className = 'btn', label = 'Скачать приложение' }: InstallAppButtonProps) {
  const { canShow, canPrompt, ios, installed, install } = usePwaInstall()
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [busy, setBusy] = useState(false)

  if (installed) {
    return null
  }

  if (!canShow) {
    return (
      <button
        type="button"
        className={className.includes('landing-download') ? className : `${className} secondary`}
        onClick={() => setShowIosHelp(true)}
        title="Откройте меню браузера → Установить приложение"
      >
        {label}
      </button>
    )
  }

  const onClick = async () => {
    if (ios || !canPrompt) {
      setShowIosHelp(true)
      return
    }
    setBusy(true)
    try {
      await install()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => void onClick()} disabled={busy}>
        {busy ? 'Установка…' : label}
      </button>

      {showIosHelp && (
        <div className="install-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowIosHelp(false)}>
          <div className="install-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Как установить «Ресурс»</h2>
            {ios ? (
              <ol>
                <li>Откройте сайт в <strong>Safari</strong> (не Chrome)</li>
                <li>Нажмите кнопку <strong>Поделиться</strong></li>
                <li>Выберите <strong>На экран «Домой»</strong></li>
                <li>Подтвердите <strong>Добавить</strong></li>
                <li>Откройте иконку с домашнего экрана и в Настройках нажмите <strong>Подключить уведомления</strong></li>
              </ol>
            ) : (
              <ol>
                <li>В Chrome / Edge откройте меню <strong>⋮</strong></li>
                <li>Выберите <strong>Установить приложение…</strong></li>
                <li>Или нажмите иконку установки в адресной строке</li>
              </ol>
            )}
            <p className="muted">
              На iPhone пуши не работают во вкладке Safari — только из приложения на «Домой» (нужен iOS 16.4+).
            </p>
            <div className="btn-row">
              <button type="button" className="btn" onClick={() => setShowIosHelp(false)}>
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
