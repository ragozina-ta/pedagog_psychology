/** Случайный элемент «на день» для этого устройства (localStorage). */
export function deviceDailyPick<T>(
  storagePrefix: string,
  items: readonly T[],
  getId: (item: T) => string,
  date = new Date(),
): T {
  if (!items.length) {
    throw new Error('deviceDailyPick: empty list')
  }

  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const key = `${storagePrefix}:${day}`

  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      const found = items.find((item) => getId(item) === saved)
      if (found) return found
    }
  } catch {
    /* private mode / blocked storage */
  }

  const pick = items[Math.floor(Math.random() * items.length)]!

  try {
    localStorage.setItem(key, getId(pick))
  } catch {
    /* */
  }

  return pick
}
