// One-shot bootstrap: create an auth user + bind them to the Aspect tenant.
// Avoids the Supabase Dashboard "Authentication → Add user → Create new user"
// + manual SQL INSERT dance.
//
// Usage (from repo root):
//   node apps/web/scripts/bootstrap-user.mjs
//
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from a local .env file at the
// repo root. The script prompts for the email + password to create.
//
// Idempotent: if the email already exists, it just ensures the tenant binding.

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const ASPECT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

// ---------- 1. Read SUPABASE_URL + SERVICE_ROLE_KEY ----------
async function loadEnv() {
  const candidates = ['.env', '.env.local', 'apps/web/.env.local'];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    const txt = await readFile(p, 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
await loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('\nMissing env vars. Add these to .env at the repo root:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJ...  (the SECRET service_role key, NOT the anon key)');
  console.error('\nThen re-run: node apps/web/scripts/bootstrap-user.mjs');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

// ---------- 2. Prompt for email + password ----------
const rl = readline.createInterface({ input: stdin, output: stdout });
const email = (await rl.question('Email to create: ')).trim();
const password = (await rl.question('Password (min 6 chars): ')).trim();
rl.close();

if (!email || !email.includes('@')) { console.error('Invalid email'); process.exit(1); }
if (password.length < 6)            { console.error('Password too short'); process.exit(1); }

// ---------- 3. Verify Aspect tenant exists ----------
const { data: tenant, error: tErr } = await admin.from('tenants').select('id, company_name').eq('id', ASPECT_TENANT_ID).maybeSingle();
if (tErr) { console.error('DB error:', tErr.message); process.exit(1); }
if (!tenant) {
  console.error(`\nAspect tenant (${ASPECT_TENANT_ID}) does not exist. Did you run supabase/seed.sql?`);
  process.exit(1);
}
console.log(`✓ Found tenant: ${tenant.company_name}`);

// ---------- 4. Create or find auth user ----------
let userId;
const { data: created, error: cErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,   // skip the confirmation email
});

if (created?.user) {
  userId = created.user.id;
  console.log(`✓ Created user ${email} (id: ${userId})`);
} else if (cErr?.message?.includes('already')) {
  // user already exists — find them
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users?.find(u => u.email === email);
  if (!existing) { console.error('User exists but could not be found:', cErr.message); process.exit(1); }
  userId = existing.id;
  console.log(`✓ User already exists ${email} (id: ${userId}) — skipping create`);
} else {
  console.error('createUser failed:', cErr?.message ?? cErr);
  process.exit(1);
}

// ---------- 5. Bind to Aspect tenant (idempotent) ----------
const { error: bErr } = await admin.from('tenant_users')
  .upsert({ tenant_id: ASPECT_TENANT_ID, user_id: userId, role: 'member' },
          { onConflict: 'tenant_id,user_id' });
if (bErr) { console.error('tenant_users bind failed:', bErr.message); process.exit(1); }
console.log(`✓ Bound user to ${tenant.company_name} as member`);

console.log(`\n${email} can now sign in at the deployed /login page.`);
