import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
const txt = await readFile('.env', 'utf8');
for (const l of txt.split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: { users } } = await admin.auth.admin.listUsers();
console.log(`Total users: ${users.length}`);
for (const u of users) {
  console.log(`  ${u.email} (id: ${u.id}, confirmed: ${!!u.email_confirmed_at})`);
}
const { data: bindings } = await admin.from('tenant_users').select('user_id, tenant_id, role');
console.log(`\nTenant bindings: ${bindings?.length ?? 0}`);
for (const b of (bindings ?? [])) console.log(`  user ${b.user_id} -> tenant ${b.tenant_id} (${b.role})`);
