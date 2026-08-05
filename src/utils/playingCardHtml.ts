/** HTML snippets styled like on-screen PlayingCard for PDF export. */

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const lightCard = (opts: { eyebrow: string; title?: string; body: string; corner?: string; index?: string }) => {
  const corner = opts.corner ?? '♥'
  return `<div style="
    break-inside:avoid;
    page-break-inside:avoid;
    width:320px;
    min-height:448px;
    aspect-ratio:2.5/3.5;
    box-sizing:border-box;
    margin:0 auto 18px;
    padding:22px 18px 24px;
    border-radius:16px;
    border:2px solid rgba(112,58,20,0.35);
    background:linear-gradient(160deg,#faf6ef 0%,#f3e8d4 48%,#ecd09c 100%);
    box-shadow:0 10px 24px rgba(49,70,79,0.14);
    color:#703a14;
    text-align:center;
    position:relative;
    display:flex;
    flex-direction:column;
    justify-content:space-between;
    font-family:Nunito,Arial,sans-serif;
  ">
    <div style="position:absolute;top:10px;left:12px;font-family:Literata,Georgia,serif;font-size:14px;opacity:0.7">${corner}</div>
    <div style="position:absolute;bottom:10px;right:12px;font-family:Literata,Georgia,serif;font-size:14px;opacity:0.7;transform:rotate(180deg)">${corner}</div>
    <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#c18636;font-weight:700;margin-top:8px">${esc(opts.eyebrow)}${opts.index ? ` · ${esc(opts.index)}` : ''}</div>
    ${opts.title ? `<div style="font-family:Literata,Georgia,serif;font-size:22px;line-height:1.25;font-weight:600;margin:10px 0;color:#703a14">${esc(opts.title)}</div>` : ''}
    <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1.45;color:#31464f;padding:8px 4px">${esc(opts.body)}</div>
  </div>`
}

const accentCard = (opts: { eyebrow: string; body: string; corner?: string; index?: string }) => {
  const corner = opts.corner ?? '♥'
  return `<div style="
    break-inside:avoid;
    page-break-inside:avoid;
    width:320px;
    min-height:448px;
    aspect-ratio:2.5/3.5;
    box-sizing:border-box;
    margin:0 auto 18px;
    padding:22px 18px 24px;
    border-radius:16px;
    border:2px solid rgba(236,208,156,0.45);
    background:linear-gradient(155deg,#703a14,#a46957 50%,#c18636);
    box-shadow:0 10px 24px rgba(49,70,79,0.2);
    color:#f7f1e6;
    text-align:center;
    position:relative;
    display:flex;
    flex-direction:column;
    justify-content:space-between;
    font-family:Nunito,Arial,sans-serif;
  ">
    <div style="position:absolute;top:10px;left:12px;font-family:Literata,Georgia,serif;font-size:14px;opacity:0.75">${corner}</div>
    <div style="position:absolute;bottom:10px;right:12px;font-family:Literata,Georgia,serif;font-size:14px;opacity:0.75;transform:rotate(180deg)">${corner}</div>
    <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#ecd09c;font-weight:700;margin-top:8px">${esc(opts.eyebrow)}${opts.index ? ` · ${esc(opts.index)}` : ''}</div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:Literata,Georgia,serif;font-size:20px;line-height:1.35;padding:12px 6px">${esc(opts.body)}</div>
  </div>`
}

export function affirmationCardsDeckHtml(
  items: { categoryLabel: string; text: string }[],
) {
  const cards = items
    .map((a, i) =>
      accentCard({
        eyebrow: a.categoryLabel,
        body: a.text,
        corner: '♥',
        index: `${i + 1}/${items.length}`,
      }),
    )
    .join('')
  return `<div style="background:#fff;padding:8px 0">
    <h1 style="font-family:Literata,Georgia,serif;color:#703a14;text-align:center;margin:0 0 20px">Колода аффирмаций</h1>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;justify-items:center">${cards}</div>
  </div>`
}

export function dailyCardsDeckHtml(
  items: { category: string; title: string; task: string }[],
) {
  const cards = items
    .map((c, i) =>
      lightCard({
        eyebrow: c.category,
        title: c.title,
        body: c.task,
        corner: '♥',
        index: `${i + 1}/${items.length}`,
      }),
    )
    .join('')
  return `<div style="background:#fff;padding:8px 0">
    <h1 style="font-family:Literata,Georgia,serif;color:#703a14;text-align:center;margin:0 0 20px">Колода карточек дня</h1>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;justify-items:center">${cards}</div>
  </div>`
}

export function singleDailyCardHtml(c: { category: string; title: string; task: string; dateLabel?: string }) {
  return `<div style="background:#fff;padding:24px;display:flex;justify-content:center">
    ${lightCard({
      eyebrow: c.dateLabel ? `${c.category} · ${c.dateLabel}` : c.category,
      title: c.title,
      body: c.task,
      corner: '♥',
    })}
  </div>`
}

export function singleAffirmationCardHtml(a: { categoryLabel: string; text: string }) {
  return `<div style="background:#fff;padding:24px;display:flex;justify-content:center">
    ${accentCard({ eyebrow: a.categoryLabel, body: a.text, corner: '♥' })}
  </div>`
}
