import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PdfItem { number: number; item: string; qty: number; cost_unit: number; total_cost: number; total_selling: number; }
export interface PdfData {
  sheetNumber: string;
  projectName: string;
  client: string;
  doneBy: string;
  date: string;
  size: string;
  photoUrl: string | null;
  logoUrl: string | null;
  companyName: string;
  currency: string;
  items: PdfItem[];
  totals: { items_cost: number; labour_cnc: number; total_cost: number; total_selling: number; profit: number; margin: number };
}

const INK = '#18181b';
const GRAY = '#6b6b72';
const LINE: [number, number, number] = [216, 199, 168];

function money(n: number) {
  return Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function toDataURL(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const data: string = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 1, h: 1 });
      img.src = data;
    });
    return { data, w: dims.w, h: dims.h };
  } catch { return null; }
}

export async function generateCostingPdf(d: PdfData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 14;
  let y = 16;

  // Logo
  const logo = d.logoUrl ? await toDataURL(d.logoUrl) : null;
  if (logo) {
    const h = 14;
    const w = Math.min(46, (logo.w / logo.h) * h);
    try { doc.addImage(logo.data, 'PNG', M, y - 4, w, h); } catch { /* ignore */ }
  }

  // Title block (right)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(INK);
  doc.text('COSTING SHEET', W - M, y + 2, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(GRAY);
  doc.text(`${d.companyName}`, W - M, y + 8, { align: 'right' });
  doc.text(`${d.sheetNumber}`, W - M, y + 12.5, { align: 'right' });

  y += 22;
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]); doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 7;

  // Header fields (left) + photo (right)
  const photo = d.photoUrl ? await toDataURL(d.photoUrl) : null;
  const photoW = 52, photoH = 40;
  const fieldRight = photo ? W - M - photoW - 6 : W - M;

  doc.setFontSize(9);
  const field = (label: string, value: string) => {
    doc.setTextColor(GRAY); doc.setFont('helvetica', 'normal');
    doc.text(label, M, y);
    doc.setTextColor(INK); doc.setFont('helvetica', 'bold');
    doc.text(value || '—', M + 24, y, { maxWidth: fieldRight - M - 24 });
    y += 6;
  };
  field('Client', d.client);
  field('Done by', d.doneBy);
  field('Date', d.date);
  if (d.size) field('Size', d.size);

  // Project description
  if (d.projectName) {
    y += 1;
    doc.setTextColor(GRAY); doc.setFont('helvetica', 'normal'); doc.text('Project', M, y);
    doc.setTextColor(INK); doc.setFont('helvetica', 'bold');
    const lines = doc.splitTextToSize(d.projectName, fieldRight - M - 24);
    doc.text(lines, M + 24, y, { maxWidth: fieldRight - M - 24 });
    y += lines.length * 5 + 1;
  }

  // Photo (right of header)
  if (photo) {
    const fmt = photo.data.includes('image/png') ? 'PNG' : 'JPEG';
    try { doc.addImage(photo.data, fmt, W - M - photoW, 45, photoW, photoH); } catch { /* ignore */ }
  }

  y = Math.max(y, 45 + (photo ? photoH : 0)) + 6;

  // Items table
  autoTable(doc, {
    startY: y,
    head: [['#', 'Item', 'Qty', 'Cost Unit', 'Total Cost', 'Total Selling']],
    body: d.items.map(i => [
      String(i.number), i.item || '—', String(i.qty),
      money(i.cost_unit), money(i.total_cost), money(i.total_selling),
    ]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.2, textColor: INK, lineColor: LINE, lineWidth: 0.2 },
    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      2: { halign: 'right', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 30 },
      5: { halign: 'right', cellWidth: 32 },
    },
    margin: { left: M, right: M },
  });

  // @ts-expect-error autotable augments doc
  let ty = (doc.lastAutoTable?.finalY ?? y) + 6;

  // Labour & CNC + totals block (right aligned)
  const labelX = W - M - 72;
  const valCostX = W - M - 36;
  const valSellX = W - M;
  doc.setFontSize(9);

  const totalLine = (label: string, cost: string, sell: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(bold ? INK : GRAY);
    doc.text(label, labelX, ty);
    doc.setTextColor(INK);
    if (cost) doc.text(cost, valCostX, ty, { align: 'right' });
    doc.text(sell, valSellX, ty, { align: 'right' });
    ty += 6;
  };

  // column captions
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(GRAY);
  doc.text('COST', valCostX, ty - 0.5, { align: 'right' });
  doc.text('SELLING', valSellX, ty - 0.5, { align: 'right' });
  ty += 4;
  doc.setFontSize(9);

  // Selling splits the same uniform markup factor across items + labour.
  const factor = d.totals.total_cost ? d.totals.total_selling / d.totals.total_cost : 1;
  totalLine('Items', money(d.totals.items_cost), money(d.totals.items_cost * factor));
  if (d.totals.labour_cnc) totalLine('Labour & CNC', money(d.totals.labour_cnc), money(d.totals.labour_cnc * factor));
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]); doc.line(labelX, ty - 3, valSellX, ty - 3);
  totalLine('Total', money(d.totals.total_cost), money(d.totals.total_selling), true);

  ty += 2;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(GRAY);
  doc.text(`Profit: ${d.currency} ${money(d.totals.profit)}   ·   Margin: ${d.totals.margin}%`, labelX, ty);

  // Footer
  doc.setFontSize(7.5); doc.setTextColor(GRAY);
  doc.text(`${d.companyName} · Generated ${d.date || ''}`, M, 290);

  const safe = (d.projectName || d.sheetNumber || 'costing').replace(/[^a-z0-9]+/gi, '-').slice(0, 40);
  doc.save(`${d.sheetNumber}-${safe}.pdf`);
}
