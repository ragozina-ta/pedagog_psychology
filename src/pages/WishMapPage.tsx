import { useRef, useState } from 'react'
import { ImageCropModal } from '../components/ImageCropModal'
import { WISH_STOCK_IMAGES, wishStockUrl } from '../data/wishStock'
import { useAppStore } from '../store/useAppStore'
import type { WishSectorId } from '../types'
import { elementToPdf } from '../utils/pdf'

const SECTORS: { id: WishSectorId; label: string; color: string }[] = [
  { id: 'career', label: 'Профессиональный рост', color: '#1a4a45' },
  { id: 'personal', label: 'Личностный рост', color: '#c47b3b' },
  { id: 'rest', label: 'Отдых и восстановление', color: '#7d9b8a' },
  { id: 'circle', label: 'Окружение и поддержка', color: '#5a6862' },
]

const INTRO_KEY = 'wishmap_intro_seen'

const INTRO_TEXT = `Карта желаний — это твоё личное визуальное пространство.
Здесь ты собираешь образы того, чего хочешь в профессии и в жизни.
Никаких «надо». Только «хочу».

Как заполнять?
Загрузи своё фото в центр — чтобы помнить: ты в центре своих желаний.
Заполни 4 сектора картинками:
Профессиональный рост — каким учителем ты хочешь стать?
Личностный рост — каким человеком ты хочешь быть?
Отдых и восстановление — где и как ты восстанавливаешь силы?
Окружение и поддержка — кто рядом с тобой?
Выбирай картинки, которые откликаются тебе. Не надо объяснять — просто чувствуй.

Можно:
Выбрать из готовой галереи
Загрузить свои фото
Менять карту каждый месяц

Не нужно:
Писать текст (только образы!)
Оценивать или критиковать свой выбор

Что дальше?
Сохрани карту как PDF
Распечатай и повесь там, где видишь каждый день
Пересматривай в трудные дни — чтобы вспомнить, куда ты идёшь

И помни:
«Ты — главный герой своей карты.
Всё, что ты видишь вокруг своего фото, — уже часть твоего пути»`

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function WishMapPage() {
  const wishImages = useAppStore((s) => s.wishImages)
  const teacherPhoto = useAppStore((s) => s.teacherPhoto)
  const addWishImage = useAppStore((s) => s.addWishImage)
  const removeWishImage = useAppStore((s) => s.removeWishImage)
  const setTeacherPhoto = useAppStore((s) => s.setTeacherPhoto)
  const [sector, setSector] = useState<WishSectorId>('career')
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return localStorage.getItem(INTRO_KEY) !== '1'
    } catch {
      return true
    }
  })
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropMode, setCropMode] = useState<'photo' | 'sector'>('photo')
  const [status, setStatus] = useState('')
  const boardRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  const sectorLabel = SECTORS.find((s) => s.id === sector)?.label ?? ''

  const dismissIntro = () => {
    try {
      localStorage.setItem(INTRO_KEY, '1')
    } catch {
      /* */
    }
    setShowIntro(false)
  }

  const onPickSectorFiles = async (files: FileList | null) => {
    if (!files?.[0]) return
    const dataUrl = await readFile(files[0])
    setCropMode('sector')
    setCropSrc(dataUrl)
  }

  const onPickPhoto = async (files: FileList | null) => {
    if (!files?.[0]) return
    const dataUrl = await readFile(files[0])
    setCropMode('photo')
    setCropSrc(dataUrl)
  }

  const addStockToSector = (file: string) => {
    addWishImage(sector, wishStockUrl(file))
    setStatus(`Добавлено в «${sectorLabel}»`)
  }

  const exportPdf = async () => {
    if (!boardRef.current) return
    setStatus('Готовим PDF…')
    const res = await elementToPdf(boardRef.current, 'karta-zhelaniy.pdf')
    setStatus(res.ok ? 'PDF готов' : res.error)
  }

  if (showIntro) {
    return (
      <div>
        <section className="page-hero">
          <h1>Карта желаний</h1>
        </section>
        <div className="panel">
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              color: 'var(--ink)',
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            {INTRO_TEXT}
          </pre>
          <div className="btn-row">
            <button type="button" className="btn" onClick={dismissIntro}>
              Начать заполнение
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <section className="page-hero">
        <h1>Карта желаний</h1>
        <p>Цели, мечты и планы на будущее — только образы.</p>
      </section>

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <div className="chip-row">
          {SECTORS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`chip ${sector === s.id ? 'active' : ''}`}
              onClick={() => setSector(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Загрузить своё фото
          </button>
          <button type="button" className="btn secondary" onClick={() => photoRef.current?.click()}>
            Фото в центре
          </button>
          <button type="button" className="btn ghost" onClick={() => void exportPdf()}>
            Скачать PDF
          </button>
          <button type="button" className="btn ghost" onClick={() => setShowIntro(true)}>
            Как заполнять?
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => void onPickSectorFiles(e.target.files)}
          />
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => void onPickPhoto(e.target.files)}
          />
        </div>
        {status && <p className="muted">{status}</p>}
      </div>

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--brand)', fontSize: '1.05rem', marginBottom: '0.35rem' }}>Галерея образов</h2>
        <p className="muted" style={{ marginBottom: '0.65rem' }}>
          Нажмите картинку — она попадёт в сектор «{sectorLabel}». Свои фото можно загрузить кнопкой выше.
        </p>
        <div className="wish-stock-grid">
          {WISH_STOCK_IMAGES.map((img) => (
            <button
              key={img.id}
              type="button"
              title="Добавить в выбранный сектор"
              onClick={() => addStockToSector(img.file)}
            >
              <img src={wishStockUrl(img.file)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      <div
        ref={boardRef}
        style={{
          position: 'relative',
          aspectRatio: '1',
          borderRadius: 24,
          overflow: 'hidden',
          border: '1px solid var(--line)',
          background: '#fffaf3',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', height: '100%' }}>
          {SECTORS.map((s, idx) => {
            const images = wishImages.filter((i) => i.sector === s.id)
            const labelPos =
              idx === 0
                ? { top: 8, left: 8 }
                : idx === 1
                  ? { top: 8, right: 8, textAlign: 'right' as const }
                  : idx === 2
                    ? { bottom: 8, left: 8 }
                    : { bottom: 8, right: 8, textAlign: 'right' as const }
            return (
              <div
                key={s.id}
                style={{
                  position: 'relative',
                  border: '1px solid rgba(28,36,33,0.08)',
                  padding: 8,
                  paddingTop: idx < 2 ? 36 : 8,
                  paddingBottom: idx >= 2 ? 36 : 8,
                  background: `${s.color}10`,
                  overflow: 'hidden',
                }}
              >
                <div className="wish-sector-label" style={{ position: 'absolute', ...labelPos, color: s.color, zIndex: 1 }}>
                  {s.label}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 6 }}>
                  {images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      title="Удалить"
                      onClick={() => removeWishImage(img.id)}
                      style={{ padding: 0, border: 'none', borderRadius: 8, overflow: 'hidden', background: 'transparent' }}
                    >
                      <img src={img.dataUrl} alt="" className="wish-thumb" />
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div
          className="wish-center"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--brand)',
            display: 'grid',
            placeItems: 'center',
            color: '#ecd09c',
            fontWeight: 700,
            fontSize: '0.75rem',
          }}
        >
          {teacherPhoto ? <img src={teacherPhoto} alt="Педагог" /> : 'Вы'}
        </div>
      </div>
      <p className="muted" style={{ marginTop: '0.75rem' }}>
        Нажмите на картинку на карте, чтобы удалить её.
      </p>

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspect={1}
          onCancel={() => setCropSrc(null)}
          onDone={(dataUrl) => {
            if (cropMode === 'photo') setTeacherPhoto(dataUrl)
            else addWishImage(sector, dataUrl)
            setCropSrc(null)
          }}
        />
      )}
    </div>
  )
}
