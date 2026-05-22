// apps/web/lib/vps-render.ts

export async function xlsxToPdf(xlsx: Buffer): Promise<Buffer> {
  const url = process.env.VPS_RENDER_URL;
  const secret = process.env.VPS_RENDER_SECRET;
  if (!url || !secret) throw new Error('VPS_RENDER_URL/SECRET missing');

  const r = await fetch(`${url}/xlsx-to-pdf`, {
    method: 'POST',
    headers: { 'content-type': 'application/octet-stream', 'x-render-secret': secret },
    body: xlsx,
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`VPS render failed (${r.status}): ${text}`);
  }
  const ab = await r.arrayBuffer();
  return Buffer.from(ab);
}
