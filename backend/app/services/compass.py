import httpx

from app.core.config import settings

CRISIS_KEYWORDS = [
    "суицид",
    "убить себя",
    "не хочу жить",
    "покончить",
    "самоубий",
    "насилие",
    "избива",
    "угрожа",
]

ALARM = (
    "Кнопка «Тревога» — сигнал, что сейчас нужна срочная опора.\n\n"
    "Прямо сейчас:\n"
    "1. Горячая линия психологической помощи: +7 (495) 989-50-50\n"
    "2. При угрозе жизни или насилия — 112 / полиция\n"
    "3. Обратитесь к администрации школы и к человеку, которому доверяете\n"
    "4. Сядьте, ноги на пол, выдох длиннее вдоха\n\n"
    "Вы не обязаны проходить это в одиночку."
)

SYSTEM = (
    "Ты — «Психологический компас», эмпатичный ассистент для педагогов. "
    "Помогаешь прожить трудный момент, даёшь техники самопомощи, мягко переформулируешь проблему. "
    "Говори по-русски, тепло, без диагнозов. Не заменяй неотложную помощь. "
    "При опасности для жизни рекомендуй горячую линию +7 (495) 989-50-50, 112, администрацию школы."
)


def detect_crisis(text: str) -> bool:
    t = text.lower()
    return any(k in t for k in CRISIS_KEYWORDS)


def local_reply(text: str) -> str:
    t = text.lower()
    if detect_crisis(text):
        return ALARM
    if any(k in t for k in ["тревог", "паник", "страшно"]):
        return (
            "Слышу тревогу. Давайте замедлимся.\n\n"
            "1) Ноги на пол\n2) Вдох на 4, выдох на 6 — 5 циклов\n"
            "3) Назовите 3 предмета вокруг\n\n"
            "Что пугает сильнее всего прямо сейчас?"
        )
    if any(k in t for k in ["выгоран", "нет сил", "истощен"]):
        return (
            "Похоже на глубокую усталость, а не на слабость.\n"
            "Микро-шаг: вода, 10 минут тишины или просьба о помощи. Что реально сделать в ближайший час?"
        )
    return (
        "Я рядом. Можно говорить честно.\n"
        "1) Что произошло?\n2) Что вы чувствуете?\n3) Что стало бы чуть легче?\n"
        "Могу предложить технику или просто побыть с вами."
    )


async def ask_llm(history: list[dict], user_text: str, urgent: bool = False) -> str:
    if urgent or detect_crisis(user_text):
        return ALARM
    if not settings.openai_api_key:
        return local_reply(user_text)
    messages = [{"role": "system", "content": SYSTEM}]
    messages.extend(history[-12:])
    messages.append({"role": "user", "content": user_text})
    try:
        async with httpx.AsyncClient(timeout=40) as client:
            res = await client.post(
                f"{settings.openai_base_url.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={"model": settings.openai_model, "messages": messages, "temperature": 0.7},
            )
            if res.status_code >= 400:
                return local_reply(user_text)
            data = res.json()
            return data["choices"][0]["message"]["content"].strip() or local_reply(user_text)
    except Exception:
        return local_reply(user_text)
