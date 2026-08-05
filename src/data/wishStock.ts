/** Stock images for wish map (served from public/pics). */
export const WISH_STOCK_IMAGES = Array.from({ length: 43 }, (_, i) => {
  const n = String(i + 1).padStart(3, '0')
  return {
    id: `stock-${n}`,
    file: `pics/wish-${n}.jpg`,
  }
})

export function wishStockUrl(file: string) {
  return `${import.meta.env.BASE_URL}${file}`
}
