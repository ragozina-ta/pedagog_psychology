# Ресурс педагога (fullstack)

PWA + FastAPI: личный кабинет, сад, ачивки, друзья, чат школы, админ-панель.

## Быстрый старт

### Backend
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Опционально Postgres: `docker compose up -d` в `backend/` (см. `DATABASE_URL` в compose).

Push-воркер: `python worker.py` (нужны VAPID-ключи в `.env`).

ИИ: задайте `OPENAI_API_KEY` в `backend/.env`.

### Frontend
```bash
npm install
# .env
echo VITE_API_URL=http://127.0.0.1:8000 > .env
npm run dev
```

GitHub Pages: `VITE_API_URL` должен указывать на задеплоенный API (не на Pages).

## Роли
- **teacher** — весь функционал, сад, друзья
- **admin** — создаёт школу при регистрации, панель `/admin`, код приглашения, похвала, отчёт

## Где нужен бэкенд
Роли, школа, друзья/полив, чат, админ-рейтинг, серверный ИИ, пуши, доверенные очки/ачивки/серия.
