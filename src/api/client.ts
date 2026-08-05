const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://127.0.0.1:8000'

const TOKEN_KEY = 'resource_access_token'
const REFRESH_KEY = 'resource_refresh_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (res.status === 204) return undefined as T
  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const detail =
      typeof data === 'object' && data && 'detail' in data
        ? String((data as { detail: unknown }).detail)
        : res.statusText
    throw new ApiError(res.status, detail)
  }
  return data as T
}

export const authApi = {
  register: (body: {
    email: string
    password: string
    full_name: string
    school_code?: string
    create_school_name?: string
  }) => api<{ access_token: string; refresh_token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    api<{ access_token: string; refresh_token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
}

export type Profile = {
  user_id: number
  email: string
  full_name: string
  role: string | null
  school: { id: number; name: string; invite_code: string } | null
  avatar_url: string | null
  years_experience: number
  points: number
  streak: number
  water_drops: number
  garden_plants: number
  level: string
  share_token: string
  favorite_affirmations: string[]
  favorite_resources: string[]
  last_activity_date: string | null
}

export const profileApi = {
  me: () => api<Profile>('/api/profile/me'),
  update: (body: Partial<Profile>) => api<Profile>('/api/profile/me', { method: 'PATCH', body: JSON.stringify(body) }),
  achievements: () =>
    api<{ id: string; title: string; category: string; description: string; earned: boolean; earned_at: string | null }[]>(
      '/api/profile/achievements',
    ),
  praises: () => api<{ id: number; message: string; created_at: string }[]>('/api/profile/praises'),
  shared: (token: string) => api<Profile>(`/api/profile/share/${token}`),
}

export const diaryApi = {
  list: () => api<{ id: number; entry_date: string; mood: string; gratitude: string; reflection: string; intention: string }[]>('/api/diary'),
  upsert: (body: { entry_date?: string; mood: string; gratitude: string; reflection: string; intention: string }) =>
    api('/api/diary', { method: 'PUT', body: JSON.stringify(body) }),
}

export const activityApi = {
  log: (kind: string, meta?: object) =>
    api<{ points_awarded: number; streak: number; points_total: number; garden_plants: number; new_achievements: string[] }>(
      '/api/activity',
      { method: 'POST', body: JSON.stringify({ kind, meta }) },
    ),
}

export const wheelApi = {
  save: (values: Record<string, number>) => api('/api/wheel', { method: 'POST', body: JSON.stringify({ values }) }),
  history: () => api<{ id: number; values: Record<string, number>; created_at: string }[]>('/api/wheel/history'),
}

export const friendsApi = {
  list: () => api<{ user_id: number; full_name: string; streak: number; garden_plants: number; points: number }[]>('/api/friends'),
  invite: () => api<{ token: string; url_path: string }>('/api/friends/invite', { method: 'POST' }),
  accept: (token: string) =>
    api<{ user_id: number; full_name: string; streak: number; garden_plants: number; points: number }>(
      `/api/friends/accept/${token}`,
      { method: 'POST' },
    ),
  water: (friendId: number) => api(`/api/friends/water/${friendId}`, { method: 'POST' }),
}

export const gardenApi = {
  me: () => api<{ points: number; streak: number; water_drops: number; garden_plants: number; level: string; plants: string[] }>('/api/garden/me'),
}

export const chatApi = {
  schoolRoom: () => api<{ id: number; title: string }>('/api/chat/rooms/school'),
  messages: (roomId: number) =>
    api<{ id: number; room_id: number; sender_id: number | null; sender_name: string | null; content: string; created_at: string }[]>(
      `/api/chat/rooms/${roomId}/messages`,
    ),
  send: (body: { content: string; room_id?: number; to_user_id?: number }) =>
    api('/api/chat/messages', { method: 'POST', body: JSON.stringify(body) }),
  challenges: () => api<{ id: number; title: string; description: string; days: number; my_progress: number }[]>('/api/chat/challenges'),
  createChallenge: (body: { title: string; description?: string; days?: number }) =>
    api('/api/chat/challenges', { method: 'POST', body: JSON.stringify(body) }),
  tickChallenge: (id: number) => api(`/api/chat/challenges/${id}/tick`, { method: 'POST' }),
}

export const adminApi = {
  teachers: () =>
    api<{ user_id: number; full_name: string; streak: number; points: number; garden_plants: number; achievements_count: number; last_activity_date: string | null }[]>(
      '/api/admin/teachers',
    ),
  stats: () => api<{ active_users: number; total_members: number; by_kind: Record<string, number> }>('/api/admin/stats/month'),
  praise: (to_user_id: number, message: string) =>
    api('/api/admin/praise', { method: 'POST', body: JSON.stringify({ to_user_id, message }) }),
  reportUrl: () => `${API_URL}/api/admin/report.pdf`,
}

export const compassApi = {
  chat: (message: string, urgent = false) =>
    api<{ reply: string; urgent: boolean }>('/api/compass/chat', {
      method: 'POST',
      body: JSON.stringify({ message, urgent }),
    }),
}

export const pushApi = {
  vapid: () => api<{ publicKey: string }>('/api/push/vapid-public-key'),
  subscribe: (subscription: PushSubscriptionJSON) =>
    api('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      }),
    }),
}

export { API_URL }
