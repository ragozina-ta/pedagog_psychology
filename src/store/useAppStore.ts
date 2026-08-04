import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultWheelValues } from '../data/wheel'
import type {
  AppSettings,
  ChatMessage,
  DiaryEntry,
  WheelSnapshot,
  WheelSphereId,
  WishImage,
  WishSectorId,
} from '../types'

interface AppState {
  wheelCurrent: Record<WheelSphereId, number>
  wheelHistory: WheelSnapshot[]
  wishImages: WishImage[]
  teacherPhoto: string | null
  diaryEntries: DiaryEntry[]
  chatMessages: ChatMessage[]
  settings: AppSettings
  setWheelValue: (id: WheelSphereId, value: number) => void
  saveWheelSnapshot: () => void
  addWishImage: (sector: WishSectorId, dataUrl: string) => void
  removeWishImage: (id: string) => void
  setTeacherPhoto: (dataUrl: string | null) => void
  upsertDiaryEntry: (entry: Omit<DiaryEntry, 'id'> & { id?: string }) => void
  deleteDiaryEntry: (id: string) => void
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'createdAt'> & { id?: string }) => void
  clearChat: () => void
  updateSettings: (patch: Partial<AppSettings>) => void
}

const uid = () => crypto.randomUUID()

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      wheelCurrent: defaultWheelValues(),
      wheelHistory: [],
      wishImages: [],
      teacherPhoto: null,
      diaryEntries: [],
      chatMessages: [
        {
          id: 'welcome',
          role: 'assistant',
          content:
            'Здравствуйте. Я «Психологический компас» — рядом, чтобы помочь прожить трудный момент. Можно писать анонимно. Если очень тяжело — нажмите «Тревога».',
          createdAt: new Date().toISOString(),
        },
      ],
      settings: {
        openaiApiKey: '',
        openaiBaseUrl: 'https://api.openai.com/v1',
        openaiModel: 'gpt-4o-mini',
        teacherPhoto: null,
      },
      setWheelValue: (id, value) =>
        set((s) => ({
          wheelCurrent: { ...s.wheelCurrent, [id]: value },
        })),
      saveWheelSnapshot: () => {
        const { wheelCurrent, wheelHistory } = get()
        const snap: WheelSnapshot = {
          id: uid(),
          date: new Date().toISOString(),
          values: { ...wheelCurrent },
        }
        set({ wheelHistory: [...wheelHistory, snap].slice(-60) })
      },
      addWishImage: (sector, dataUrl) =>
        set((s) => ({
          wishImages: [...s.wishImages, { id: uid(), sector, dataUrl }],
        })),
      removeWishImage: (id) =>
        set((s) => ({ wishImages: s.wishImages.filter((i) => i.id !== id) })),
      setTeacherPhoto: (dataUrl) => set({ teacherPhoto: dataUrl }),
      upsertDiaryEntry: (entry) =>
        set((s) => {
          if (entry.id) {
            return {
              diaryEntries: s.diaryEntries.map((e) =>
                e.id === entry.id ? { ...e, ...entry, id: entry.id } : e,
              ),
            }
          }
          const existing = s.diaryEntries.find((e) => e.date === entry.date)
          if (existing) {
            return {
              diaryEntries: s.diaryEntries.map((e) =>
                e.id === existing.id ? { ...existing, ...entry, id: existing.id } : e,
              ),
            }
          }
          return {
            diaryEntries: [{ ...entry, id: uid() }, ...s.diaryEntries],
          }
        }),
      deleteDiaryEntry: (id) =>
        set((s) => ({ diaryEntries: s.diaryEntries.filter((e) => e.id !== id) })),
      addChatMessage: (msg) =>
        set((s) => ({
          chatMessages: [
            ...s.chatMessages,
            {
              id: msg.id ?? uid(),
              role: msg.role,
              content: msg.content,
              urgent: msg.urgent,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      clearChat: () =>
        set({
          chatMessages: [
            {
              id: uid(),
              role: 'assistant',
              content: 'Диалог очищен. Я снова рядом. О чём хотите поговорить?',
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    { name: 'pedagog-resource-v1' },
  ),
)
