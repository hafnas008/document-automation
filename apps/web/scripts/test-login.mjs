// Verify the login credentials work by hitting Supabase auth from outside.
// This proves whether the issue is credentials (API will fail) or UI/Vercel env (API succeeds, browser fails).
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
const txt = await readFile('.env', 'utf8');
for (const l of txt.split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await supa.auth.signInWithPassword({
  email: 'hafnas008@gmail.com',
  password: 'Aspect2026!',
});
if (error) { console.error('LOGIN FAILED:', error.message); process.exit(1); }
console.log(`✓ LOGIN OK as ${data.user.email}, id ${data.user.id}`);
console.log(`  access_token len: ${data.session.access_token.length}`);
