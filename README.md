# Ресурс педагога (fullstack)

PWA + FastAPI: личный кабинет, сад, ачивки, друзья, чат школы, админ-панель.

**Production API:** https://whatislav.online  
**ReDoc:** https://whatislav.online/redoc  

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

Опционально Postgres: `docker compose up -d` в `backend/`.

### Frontend
```bash
npm install
# для локальной разработки с локальным API:
# VITE_API_URL=http://127.0.0.1:8000
# для работы с прод-API:
# VITE_API_URL=https://whatislav.online
cp .env.example .env
npm run dev
```

GitHub Pages собирается с `VITE_API_URL=https://whatislav.online` (см. `.github/workflows/deploy-pages.yml`).

## Роли
- **teacher** — весь функционал, сад, друзья
- **admin** — создаёт школу при регистрации, панель `/admin`, код приглашения, похвала, отчёт

## Где нужен бэкенд
Роли, школа, друзья/полив, чат, админ-рейтинг, серверный ИИ, пуши, доверенные очки/ачивки/серия.
