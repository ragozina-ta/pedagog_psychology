export type WheelSphereId =
  | 'meaning'
  | 'finance'
  | 'children'
  | 'support'
  | 'rest'
  | 'health'
  | 'family'
  | 'growth'

export interface WheelSphere {
  id: WheelSphereId
  label: string
  hint: string
}

export interface WheelSnapshot {
  id: string
  date: string
  values: Record<WheelSphereId, number>
}

export type WishSectorId = 'career' | 'personal' | 'rest' | 'circle'

export interface WishImage {
  id: string
  sector: WishSectorId
  dataUrl: string
}

export interface DailyCard {
  id: string
  title: string
  task: string
  category: string
}

export interface DiaryEntry {
  id: string
  date: string
  mood: number
  wins: string
  challenges: string
  meanings: string
  gratitude: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  urgent?: boolean
}

export interface Affirmation {
  id: string
  text: string
  category: 'confidence' | 'energy' | 'children' | 'acceptance'
}

export interface ResourceItem {
  id: string
  title: string
  category: 'recovery' | 'parents' | 'methods' | 'meditation'
  summary: string
  body: string
  duration?: string
}

export interface AppSettings {
  openaiApiKey: string
  openaiBaseUrl: string
  openaiModel: string
  teacherPhoto: string | null
}
