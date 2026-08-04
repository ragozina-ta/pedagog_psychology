import { useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { WishSectorId } from '../types'
import { elementToPdf } from '../utils/pdf'

const SECTORS: { id: WishSectorId; label: string; color: string }[] = [
  { id: 'career', label: 'Профессиональный рост', color: '#1a4a45' },
  { id: 'personal', label: 'Личностный рост', color: '#c47b3b' },
  { id: 'rest', label: 'Отдых', color: '#7d9b8a' },
  { id: 'circle', label: 'Окружение', color: '#5a6862' },
]

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
  const boardRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  const onAddImages = async (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const dataUrl = await readFile(file)
      addWishImage(sector, dataUrl)
    }
  }

  const exportPdf = async () => {
    if (!boardRef.current) return
    await elementToPdf(boardRef.current, 'karta-zhelaniy.pdf')
  }

  return (
    <div>
      <section className="page-hero">
        <h1>Карта желаний</h1>
        <p>Только картинки — четыре сектора и ваше фото в центре. Можно скачать PDF.</p>
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
            Добавить картинки в сектор
          </button>
          <button type="button" className="btn secondary" onClick={() => photoRef.current?.click()}>
            Фото в центре
          </button>
          <button type="button" className="btn ghost" onClick={exportPdf}>
            Скачать PDF
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onAddImages(e.target.files)} />
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (f) setTeacherPhoto(await readFile(f))
            }}
          />
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
          {SECTORS.map((s) => {
            const images = wishImages.filter((i) => i.sector === s.id)
            return (
              <div
                key={s.id}
                style={{
                  border: '1px solid rgba(28,36,33,0.08)',
                  padding: 8,
                  background: `${s.color}10`,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: s.color,
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {s.label}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 6 }}>
                  {images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      title="Удалить"
                      onClick={() => removeWishImage(img.id)}
                      style={{ padding: 0, border: 'none', borderRadius: 8, overflow: 'hidden', background: 'transparent' }}
                    >
                      <img src={img.dataUrl} alt="" style={{ width: '100%', height: 64, objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '22%',
            aspectRatio: '1',
            borderRadius: '50%',
            border: '4px solid #fff',
            boxShadow: '0 8px 24px rgba(26,74,69,0.25)',
            overflow: 'hidden',
            background: 'var(--brand)',
            display: 'grid',
            placeItems: 'center',
            color: '#c8d9c4',
            fontWeight: 700,
          }}
        >
          {teacherPhoto ? (
            <img src={teacherPhoto} alt="Педагог" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            'Вы'
          )}
        </div>
      </div>
      <p className="muted" style={{ marginTop: '0.75rem' }}>
        Нажмите на картинку, чтобы удалить её с доски.
      </p>
    </div>
  )
}
