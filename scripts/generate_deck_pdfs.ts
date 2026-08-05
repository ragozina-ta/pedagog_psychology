/**
 * Pre-generate deck PDFs: one playing card per A4 page (no cutoffs).
 * Run: npx tsx scripts/generate_deck_pdfs.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { AFFIRMATION_LABELS, AFFIRMATIONS } from '../src/data/affirmations'
import { DAILY_CARDS } from '../src/data/cards'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'decks')

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function accentCard(opts: { eyebrow: string; body: string; index: string }) {
  return `<section class="page">
  <article class="card card--accent">
    <span class="corner tl">♥</span>
    <span class="corner br">♥</span>
    <div class="eyebrow">${esc(opts.eyebrow)} · ${esc(opts.index)}</div>
    <div class="body">${esc(opts.body)}</div>
  </article>
</section>`
}

function lightCard(opts: { eyebrow: string; title: string; body: string; index: string }) {
  return `<section class="page">
  <article class="card card--light">
    <span class="corner tl">♥</span>
    <span class="corner br">♥</span>
    <div class="eyebrow">${esc(opts.eyebrow)} · ${esc(opts.index)}</div>
    <h2 class="title">${esc(opts.title)}</h2>
    <div class="body">${esc(opts.body)}</div>
  </article>
</section>`
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,600;7..72,700&family=Nunito:wght@400;600;700&display=swap');
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  .page {
    width: 210mm;
    height: 297mm;
    page-break-after: always;
    break-after: page;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    padding: 12mm;
  }
  .page:last-child { page-break-after: auto; break-after: auto; }
  .card {
    width: 120mm;
    height: 168mm;
    border-radius: 10mm;
    padding: 10mm 8mm;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
    font-family: Nunito, Arial, sans-serif;
    overflow: hidden;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .card--accent {
    background: linear-gradient(155deg, #703a14, #a46957 50%, #c18636);
    border: 1.2mm solid rgba(236,208,156,0.45);
    color: #f7f1e6;
    box-shadow: 0 4mm 10mm rgba(49,70,79,0.18);
  }
  .card--light {
    background: linear-gradient(160deg, #faf6ef 0%, #f3e8d4 48%, #ecd09c 100%);
    border: 1.2mm solid rgba(112,58,20,0.35);
    color: #703a14;
    box-shadow: 0 4mm 10mm rgba(49,70,79,0.14);
  }
  .corner {
    position: absolute;
    font-family: Literata, Georgia, serif;
    font-size: 5mm;
    opacity: 0.75;
  }
  .corner.tl { top: 4mm; left: 5mm; }
  .corner.br { bottom: 4mm; right: 5mm; transform: rotate(180deg); }
  .eyebrow {
    font-size: 3.2mm;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 700;
    margin-top: 4mm;
  }
  .card--accent .eyebrow { color: #ecd09c; }
  .card--light .eyebrow { color: #c18636; }
  .title {
    font-family: Literata, Georgia, serif;
    font-size: 7mm;
    line-height: 1.25;
    margin: 4mm 0;
    font-weight: 700;
  }
  .body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Literata, Georgia, serif;
    font-size: 5.2mm;
    line-height: 1.35;
    padding: 2mm;
  }
  .card--light .body {
    font-size: 4.4mm;
    color: #31464f;
    font-family: Nunito, Arial, sans-serif;
  }
`

function wrapHtml(title: string, cardsHtml: string) {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"/><title>${esc(title)}</title>
<style>${CSS}</style></head><body>${cardsHtml}</body></html>`
}

async function htmlToPdf(html: string, outPath: string) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle' })
  // wait for fonts
  await page.evaluate(async () => {
    // @ts-expect-error document fonts
    if (document.fonts?.ready) await document.fonts.ready
  })
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  })
  await browser.close()
}

async function main() {
  mkdirSync(OUT, { recursive: true })

  const affHtml = wrapHtml(
    'Колода аффирмаций',
    AFFIRMATIONS.map((a, i) =>
      accentCard({
        eyebrow: AFFIRMATION_LABELS[a.category],
        body: a.text,
        index: `${i + 1}/${AFFIRMATIONS.length}`,
      }),
    ).join(''),
  )
  const affPath = join(OUT, 'koloda-affirmaciy.pdf')
  console.log('Generating affirmations PDF…', AFFIRMATIONS.length, 'cards')
  await htmlToPdf(affHtml, affPath)

  const cardsHtml = wrapHtml(
    'Колода карточек дня',
    DAILY_CARDS.map((c, i) =>
      lightCard({
        eyebrow: c.category,
        title: c.title,
        body: c.task,
        index: `${i + 1}/${DAILY_CARDS.length}`,
      }),
    ).join(''),
  )
  const cardsPath = join(OUT, 'koloda-kartochek.pdf')
  console.log('Generating daily cards PDF…', DAILY_CARDS.length, 'cards')
  await htmlToPdf(cardsHtml, cardsPath)

  // tiny meta for debugging
  writeFileSync(
    join(OUT, 'README.txt'),
    `Pre-generated deck PDFs\naffirmations: ${AFFIRMATIONS.length}\ncards: ${DAILY_CARDS.length}\n`,
  )
  console.log('Done:', affPath, cardsPath)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
