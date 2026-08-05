import { useState } from 'react'
import { usePwaInstall } from '../hooks/usePwaInstall'

interface InstallAppButtonProps {
  className?: string
  label?: string
}

export function InstallAppButton({ className = 'btn', label = 'Скачать приложение' }: InstallAppButtonProps) {
  const { canShow, canPrompt, ios, installed, install } = usePwaInstall()
  const [showHelp, setShowHelp] = useState(false)
  const [busy, setBusy] = useState(false)

  if (installed) {
    return null
  }

  const openHelp = () => setShowHelp(true)

  const onClick = async () => {
    if (ios || !canPrompt) {
      openHelp()
      return
    }
    setBusy(true)
    try {
      const ok = await install()
      if (!ok) openHelp()
    } finally {
      setBusy(false)
    }
  }

  const btnClass =
    !canShow && !className.includes('landing-download') ? `${className} secondary` : className

  return (
    <>
      <button type="button" className={btnClass} onClick={() => void onClick()} disabled={busy}>
        {busy ? 'Установка…' : label}
      </button>

      {showHelp && (
        <div className="install-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowHelp(false)}>
          <div className="install-modal" onClick={(e) => e.stopPropagation()}>
            <div className="install-modal__body">
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
            </div>
            <div className="install-modal__footer">
              <button type="button" className="btn" onClick={() => setShowHelp(false)}>
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
