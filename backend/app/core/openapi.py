"""OpenAPI / ReDoc metadata for Ресурс API."""

API_TITLE = "Ресурс API"
API_VERSION = "1.0.0"

API_DESCRIPTION = """
Backend для PWA **«Ресурс»** — пространство заботы о педагоге.

## Авторизация

Большинство эндпоинтов требуют JWT:

```
Authorization: Bearer <access_token>
```

Токены выдаются в `POST /api/auth/register` и `POST /api/auth/login`.

## Роли

| Роль | Как получить | Доступ |
|------|----------------|--------|
| `teacher` | Регистрация с кодом школы | Весь пользовательский функционал |
| `admin` | Регистрация с созданием школы | + панель `/api/admin/*`, код приглашения |

## Документация

- **Swagger UI:** [`/docs`](/docs)
- **ReDoc:** [`/redoc`](/redoc)
- **OpenAPI JSON:** [`/openapi.json`](/openapi.json)

## Здоровье

`GET /health` — liveness без авторизации.
"""

TAGS_METADATA = [
    {
        "name": "health",
        "description": "Проверка доступности сервиса.",
    },
    {
        "name": "auth",
        "description": "Регистрация, вход, JWT access/refresh.",
    },
    {
        "name": "schools",
        "description": "Школа пользователя, присоединение по коду, код для admin.",
    },
    {
        "name": "profile",
        "description": "Профиль, избранное, ачивки, похвалы, публичная ссылка.",
    },
    {
        "name": "diary",
        "description": "Дневник педагога: благодарность, рефлексия, намерение, настроение.",
    },
    {
        "name": "wheel",
        "description": "Срезы колеса баланса (8 сфер).",
    },
    {
        "name": "activity",
        "description": "Начисление очков, капель, серии и проверка ачивок.",
    },
    {
        "name": "garden",
        "description": "Состояние сада и визуальные стадии растений.",
    },
    {
        "name": "friends",
        "description": "Друзья (до 5), инвайты, полив, общий сад.",
    },
    {
        "name": "chat",
        "description": "Чат школы, сообщения, WebSocket, челленджи.",
    },
    {
        "name": "admin",
        "description": "Только для роли admin: рейтинг, статистика, похвала, отчёт.",
    },
    {
        "name": "compass",
        "description": "ИИ-компас (ключ на сервере) + локальный fallback и кнопка «Тревога».",
    },
    {
        "name": "push",
        "description": "Web Push: VAPID public key и подписка клиента.",
    },
]
