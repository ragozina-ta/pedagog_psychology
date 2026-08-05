# API documentation — Ресурс

Интерактивная документация генерируется FastAPI из кода.

## Открыть в браузере

После запуска API (`uvicorn app.main:app --reload --port 8000`):

| Интерфейс | URL |
|-----------|-----|
| **ReDoc** (читаемый справочник) | http://127.0.0.1:8000/redoc |
| **Swagger UI** (попробовать запросы) | http://127.0.0.1:8000/docs |
| **OpenAPI JSON** | http://127.0.0.1:8000/openapi.json |
| Health | http://127.0.0.1:8000/health |

В Swagger нажмите **Authorize** и вставьте `access_token` (без слова `Bearer` — UI добавит сам).

## Быстрый сценарий

1. `POST /api/auth/register` — создать школу (admin) или вступить по коду (teacher)
2. Скопировать `access_token`
3. `GET /api/profile/me` — профиль, роль, код школы (для admin)
4. `PUT /api/diary` — запись дневника → очки/серия
5. `POST /api/activity` с `kind: "card"` — выполнить карточку дня
6. `GET /api/garden/me` — сад
7. `POST /api/compass/chat` — ИИ-компас (нужен `OPENAI_API_KEY` на сервере; иначе локальный fallback)

## Группы эндпоинтов

| Tag | Prefix | Назначение |
|-----|--------|------------|
| auth | `/api/auth` | register, login |
| schools | `/api/schools` | школа, join по коду, invite-code |
| profile | `/api/profile` | me, achievements, praises, share |
| diary | `/api/diary` | список / день / upsert |
| wheel | `/api/wheel` | сохранить срез, history |
| activity | `/api/activity` | начисление очков (`diary`, `card`, `affirmation`, `resource`, …) |
| garden | `/api/garden` | состояние сада |
| friends | `/api/friends` | список, invite, accept, water, shared-garden |
| chat | `/api/chat` | комнаты, сообщения, WS `/api/chat/ws/{room_id}?token=…`, челленджи |
| admin | `/api/admin` | teachers, stats, praise, report (только admin) |
| compass | `/api/compass` | chat, history; тревога → горячая линия |
| push | `/api/push` | vapid-public-key, subscribe |

## Activity kinds (очки)

| kind | Очки | Капли |
|------|------|-------|
| diary | 10 | 3 |
| card | 5 | 2 |
| affirmation | 3 | 1 |
| resource | 7 | 2 |
| wheel | 5 | 2 |
| mood_check | 2 | 1 |
| water_friend | 5 | 1 |
| invite | 20 | 0 |
| share_achievement | 15 | 0 |
| challenge_tick | 5 | 1 |

Часть kinds ограничена **1 раз в сутки** на пользователя (антиспам).

## Ошибки

Типичный ответ FastAPI:

```json
{ "detail": "текст ошибки" }
```

| HTTP | Когда |
|------|--------|
| 401 | Нет / неверный JWT |
| 403 | Не admin для `/api/admin/*` |
| 404 | Сущность не найдена |
| 400 | Валидация / бизнес-правило (уже полили друга сегодня и т.п.) |

## Переменные окружения

См. [`.env.example`](../.env.example): `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`, `OPENAI_*`, `VAPID_*`.
