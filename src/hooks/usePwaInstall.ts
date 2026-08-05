import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Храним событие на уровне модуля — иначе после ухода с лендинга prompt теряется. */
let deferredPrompt: BeforeInstallPromptEvent | null = null
let installedFlag = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return deferredPrompt
}

function getInstalledSnapshot() {
  return installedFlag
}

function isIos() {
  if (typeof navigator === 'undefined') return false
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

let listenersBound = false

/** Вызывать как можно раньше (main), чтобы не пропустить beforeinstallprompt. */
export function initPwaInstallListeners() {
  bindGlobalListeners()
}

function bindGlobalListeners() {
  if (listenersBound || typeof window === 'undefined') return
  listenersBound = true
  installedFlag = isStandalone()

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    installedFlag = true
    deferredPrompt = null
    emit()
  })
}

export function usePwaInstall() {
  const deferred = useSyncExternalStore(subscribe, getSnapshot, () => null)
  const installed = useSyncExternalStore(
    subscribe,
    getInstalledSnapshot,
    () => false,
  )
  const [ios, setIos] = useState(false)

  useEffect(() => {
    bindGlobalListeners()
    installedFlag = isStandalone()
    setIos(isIos() && !isStandalone())
    emit()
  }, [])

  const canPrompt = Boolean(deferred) && !installed
  const canShow = !installed && (canPrompt || ios)

  const install = useCallback(async () => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    if (outcome === 'accepted') installedFlag = true
    emit()
    return outcome === 'accepted'
  }, [deferred])

  return { canShow, canPrompt, ios, installed, install }
}
