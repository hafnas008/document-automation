import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
const txt = await readFile('.env', 'utf8');
for (const l of txt.split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

console.log('--- tenants ---');
const { data: tenants, error: tErr } = await admin.from('tenants').select('id, company_name, trn_number');
if (tErr) console.log('  ERROR:', tErr.message); else for (const t of (tenants ?? [])) console.log(`  ${t.id}  ${t.company_name}  trn=${t.trn_number}`);

console.log('\n--- costing_sheets ---');
const { data: sheets, error: sErr } = await admin.from('costing_sheets').select('id, sheet_number, title');
if (sErr) console.log('  ERROR:', sErr.message); else console.log(`  ${sheets?.length ?? 0} sheets`);

console.log('\n--- existing public tables (factory tables) ---');
const { data: t1, error: e1 } = await admin.from('factory_partners').select('id').limit(1);
if (e1) console.log('  factory_partners: not present (', e1.message, ')'); else console.log('  factory_partners: present');
