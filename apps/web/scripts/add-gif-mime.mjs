// Add image/gif to allowed MIME types on tenant-logos bucket
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
const txt = await readFile('.env', 'utf8');
for (const l of txt.split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await admin.storage.updateBucket('tenant-logos', {
  allowedMimeTypes: ['image/png','image/jpeg','image/webp','image/svg+xml','image/gif'],
  fileSizeLimit: 2097152,
  public: true,
});
if (error) { console.error('FAIL:', error.message); process.exit(1); }
console.log('✓ tenant-logos now accepts: png, jpeg, webp, svg, gif');
