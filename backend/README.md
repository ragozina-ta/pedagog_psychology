# Backend «Ресурс»

## Запуск

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Docker: `docker compose up --build`

## Документация API

| | URL |
|--|-----|
| ReDoc | http://127.0.0.1:8000/redoc |
| Swagger | http://127.0.0.1:8000/docs |
| OpenAPI | http://127.0.0.1:8000/openapi.json |

Текстовый обзор: [docs/API.md](docs/API.md)
