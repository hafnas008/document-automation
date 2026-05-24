import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
const txt = await readFile('.env', 'utf8');
for (const l of txt.split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const ASPECT = '00000000-0000-0000-0000-000000000001';
const email = process.argv[2];
const password = process.argv[3];
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let userId;
const { data: list } = await admin.auth.admin.listUsers();
const existing = list?.users?.find(u => u.email === email);
if (existing) {
  userId = existing.id;
  const { error } = await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
  if (error) { console.error('updatePassword failed:', error.message); process.exit(1); }
  console.log(`✓ Updated password for existing user ${email}`);
} else {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) { console.error('createUser failed:', error.message); process.exit(1); }
  userId = data.user.id;
  console.log(`✓ Created user ${email}`);
}

const { error: bErr } = await admin.from('tenant_users').upsert(
  { tenant_id: ASPECT, user_id: userId, role: 'member' },
  { onConflict: 'tenant_id,user_id' }
);
if (bErr) { console.error('bind failed:', bErr.message); process.exit(1); }
console.log(`✓ Bound to Aspect Interior LLC`);
console.log(`\nLogin at https://document-automation-sooty.vercel.app`);
console.log(`  Email: ${email}`);
console.log(`  Password: ${password}`);
