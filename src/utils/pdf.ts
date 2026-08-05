import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { saveBlob } from './download'

export async function elementToPdf(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })
  const img = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
  const w = canvas.width * ratio
  const h = canvas.height * ratio
  const x = (pageWidth - w) / 2
  const y = 8
  pdf.addImage(img, 'PNG', x, y, w, Math.min(h, pageHeight - 16))
  const blob = pdf.output('blob')
  return saveBlob(blob, filename)
}

export function downloadTextPdf(title: string, lines: string[], filename: string) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text(title, 14, 20)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  let y = 32
  for (const line of lines) {
    const wrapped = pdf.splitTextToSize(line, 180)
    for (const w of wrapped) {
      if (y > 280) {
        pdf.addPage()
        y = 20
      }
      pdf.text(w, 14, y)
      y += 7
    }
    y += 3
  }
  return saveBlob(pdf.output('blob'), filename)
}

/** Cyrillic-safe PDF via canvas rendering of HTML block */
export async function downloadHtmlPdf(html: string, filename: string, width = 794) {
  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-9999px;top:0;width:${width}px;padding:32px;background:#fff;color:#1c2421;font-family:Nunito,Arial,sans-serif;`
  host.innerHTML = html
  document.body.appendChild(host)
  try {
    return await elementToPdf(host, filename)
  } finally {
    document.body.removeChild(host)
  }
}
