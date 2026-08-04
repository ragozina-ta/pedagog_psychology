import { Link } from 'react-router-dom'
import { affirmationForDate } from '../data/affirmations'
import { cardForDate } from '../data/cards'

const modules = [
  { to: '/wheel', eyebrow: '01', title: 'Колесо баланса', text: '8 сфер жизни педагога и подсказки при низких баллах.' },
  { to: '/wish-map', eyebrow: '02', title: 'Карта желаний', text: 'Визуальная доска из картинок и ваше фото в центре.' },
  { to: '/cards', eyebrow: '03', title: 'Карточки дня', text: 'Микрозадания на каждый день — на экране или в PDF.' },
  { to: '/diary', eyebrow: '04', title: 'Дневник субъекта', text: 'Рефлексия, график настроения и облако слов.' },
  { to: '/compass', eyebrow: '05', title: 'Психологический компас', text: 'Эмпатичный чат и кнопка «Тревога».' },
  { to: '/affirmations', eyebrow: '06', title: 'Аффирмации', text: 'Поддерживающая фраза и картинка для заставки.' },
  { to: '/resources', eyebrow: '07', title: 'Ресурсный банк', text: 'Техники, скрипты, идеи и медитации.' },
]

export function HomePage() {
  const affirmation = affirmationForDate()
  const card = cardForDate()

  return (
    <div>
      <section className="page-hero">
        <h1>Ресурс педагога</h1>
        <p>
          Инструменты самоподдержки прямо в браузере: баланс, дневник, карта желаний и бережный
          собеседник. Данные хранятся у вас на устройстве.
        </p>
      </section>

      <div className="panel" style={{ marginBottom: '1.25rem' }}>
        <div className="eyebrow" style={{ color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Сегодня
        </div>
        <h2 style={{ color: 'var(--brand)', fontSize: '1.35rem' }}>{affirmation.text}</h2>
        <p className="muted">Карточка дня: {card.title} — {card.task}</p>
        <div className="btn-row">
          <Link className="btn" to="/affirmations">Аффирмация</Link>
          <Link className="btn secondary" to="/cards">Открыть карточку</Link>
          <Link className="btn ghost" to="/compass">Нужна поддержка</Link>
        </div>
      </div>

      <div className="grid-modules">
        {modules.map((m, i) => (
          <Link key={m.to} to={m.to} className="module-link" style={{ animationDelay: `${i * 0.04}s` }}>
            <div className="eyebrow">{m.eyebrow}</div>
            <h2>{m.title}</h2>
            <p>{m.text}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
