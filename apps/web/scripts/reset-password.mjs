// One-shot password reset. Reads keys from repo-root .env.
// Usage: node apps/web/scripts/reset-password.mjs <email> <new-password>
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';

const txt = await readFile('.env', 'utf8');
for (const l of txt.split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) { console.error('Usage: reset-password.mjs <email> <password>'); process.exit(1); }

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: list } = await admin.auth.admin.listUsers();
const user = list?.users?.find(u => u.email === email);
if (!user) { console.error(`No user with email ${email}`); process.exit(1); }

const { error } = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
if (error) { console.error('updateUser failed:', error.message); process.exit(1); }

console.log(`✓ Password updated for ${email}`);
