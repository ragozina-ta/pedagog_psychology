import { COMPASS_SYSTEM_PROMPT, localCompassReply, detectCrisis } from '../data/compass'
import type { ChatMessage } from '../types'

interface AskOptions {
  apiKey?: string
  baseUrl?: string
  model?: string
  history: ChatMessage[]
  userText: string
}

export async function askCompass({
  apiKey,
  baseUrl = 'https://api.openai.com/v1',
  model = 'gpt-4o-mini',
  history,
  userText,
}: AskOptions): Promise<string> {
  if (!apiKey?.trim() || detectCrisis(userText)) {
    return localCompassReply(userText)
  }

  try {
    const messages = [
      { role: 'system', content: COMPASS_SYSTEM_PROMPT },
      ...history
        .filter((m) => m.role !== 'system')
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userText },
    ]

    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.7 }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.warn('LLM error', err)
      return localCompassReply(userText)
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    return data.choices?.[0]?.message?.content?.trim() || localCompassReply(userText)
  } catch (e) {
    console.warn(e)
    return localCompassReply(userText)
  }
}
