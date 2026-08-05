import { useCallback, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'

async function getCroppedDataUrl(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )
  return canvas.toDataURL('image/jpeg', 0.92)
}

type Props = {
  src: string
  aspect?: number
  onCancel: () => void
  onDone: (dataUrl: string) => void
}

export function ImageCropModal({ src, aspect = 1, onCancel, onDone }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  const onCropComplete = useCallback((_a: Area, pixels: Area) => {
    setArea(pixels)
  }, [])

  const confirm = async () => {
    if (!area) return
    setBusy(true)
    try {
      const dataUrl = await getCroppedDataUrl(src, area)
      onDone(dataUrl)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="install-modal-backdrop" role="dialog" aria-modal="true">
      <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ color: 'var(--brand)', marginTop: 0 }}>Обрезка</h2>
        <p className="muted">Сдвиньте рамку и масштаб, чтобы выбрать фрагмент.</p>
        <div className="crop-stage">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Масштаб</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mood-slider"
          />
        </div>
        <div className="btn-row">
          <button type="button" className="btn" disabled={busy} onClick={() => void confirm()}>
            Готово
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}
