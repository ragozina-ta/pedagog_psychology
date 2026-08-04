import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/icons')
mkdirSync(outDir, { recursive: true })

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function createPng(size, draw) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x++) {
      const i = row + 1 + x * 4
      const [r, g, b, a] = draw(x, y, size)
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
      raw[i + 3] = a
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function drawIcon(x, y, size) {
  const cx = size / 2
  const cy = size / 2
  const r = Math.hypot(x - cx, y - cy)
  const radius = size * 0.42
  const bg = r < size * 0.48
  if (!bg) return [0, 0, 0, 0]

  // rounded square background via soft edge
  const half = size / 2
  const corner = size * 0.18
  const dx = Math.max(Math.abs(x - half) - (half - corner), 0)
  const dy = Math.max(Math.abs(y - half) - (half - corner), 0)
  if (Math.hypot(dx, dy) > corner) return [0, 0, 0, 0]

  // circle ring
  const ringDist = Math.abs(r - size * 0.28)
  if (ringDist < size * 0.035) return [200, 217, 196, 255]

  // needle tip
  const angle = Math.atan2(y - cy, x - cx)
  if (Math.abs(angle + Math.PI / 2) < 0.18 && r < size * 0.28 && r > size * 0.06) {
    return [200, 217, 196, 255]
  }
  if (Math.abs(angle - Math.PI / 2) < 0.18 && r < size * 0.28 && r > size * 0.06) {
    return [125, 155, 138, 255]
  }

  // center
  if (r < size * 0.06) return [232, 184, 109, 255]

  return [26, 74, 69, 255]
}

for (const size of [192, 512]) {
  const png = createPng(size, drawIcon)
  writeFileSync(join(outDir, `icon-${size}.png`), png)
  console.log(`Wrote icon-${size}.png`)
}
