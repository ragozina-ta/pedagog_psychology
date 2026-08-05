/** Save blob on desktop + iOS (Share sheet). */

export type SaveResult = { ok: true; method: 'share' | 'download' | 'open' } | { ok: false; error: string }

export async function saveBlob(blob: Blob, filename: string): Promise<SaveResult> {
  const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' })

  try {
    const nav = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean
      share?: (data: ShareData) => Promise<void>
    }
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: filename })
      return { ok: true, method: 'share' }
    }
  } catch (e) {
    // User cancel — not an error for UX
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { ok: false, error: 'Отменено' }
    }
  }

  try {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    // iOS Safari often ignores download — open in new tab as fallback
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (isIos) {
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      return { ok: true, method: 'open' }
    }
    setTimeout(() => URL.revokeObjectURL(url), 4_000)
    return { ok: true, method: 'download' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Не удалось сохранить файл' }
  }
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}
