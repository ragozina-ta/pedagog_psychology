import { useAppStore } from '../store/useAppStore'

export function SettingsPage() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)

  return (
    <div>
      <section className="page-hero">
        <h1>Настройки</h1>
        <p>
          Приложение работает без сервера. Для расширенного ИИ-компаса можно указать ключ
          OpenAI-совместимого API — он хранится только в браузере.
        </p>
      </section>

      <div className="panel">
        <div className="field">
          <label htmlFor="apiKey">API-ключ (опционально)</label>
          <input
            id="apiKey"
            type="password"
            value={settings.openaiApiKey}
            onChange={(e) => updateSettings({ openaiApiKey: e.target.value })}
            placeholder="sk-..."
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor="baseUrl">Base URL</label>
          <input
            id="baseUrl"
            value={settings.openaiBaseUrl}
            onChange={(e) => updateSettings({ openaiBaseUrl: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="model">Модель</label>
          <input
            id="model"
            value={settings.openaiModel}
            onChange={(e) => updateSettings({ openaiModel: e.target.value })}
          />
        </div>
        <p className="muted">
          Без ключа компас отвечает локальными сценариями поддержки, техниками и кнопкой «Тревога».
          Ключ никогда не уходит на наш сервер — запросов к бэкенду нет.
        </p>
      </div>
    </div>
  )
}
