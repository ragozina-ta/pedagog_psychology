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
        className={`${className} secondary`}
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
                <li>Откройте сайт в <strong>Safari</strong></li>
                <li>Нажмите кнопку <strong>Поделиться</strong></li>
                <li>Выберите <strong>На экран «Домой»</strong></li>
                <li>Подтвердите <strong>Добавить</strong></li>
              </ol>
            ) : (
              <ol>
                <li>В Chrome / Edge откройте меню <strong>⋮</strong></li>
                <li>Выберите <strong>Установить приложение…</strong></li>
                <li>Или нажмите иконку установки в адресной строке</li>
              </ol>
            )}
            <p className="muted">Нужен HTTPS (GitHub Pages) или localhost. После установки приложение откроется без вкладок браузера.</p>
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
