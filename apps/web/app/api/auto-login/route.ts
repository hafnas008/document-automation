import { supabaseServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// TEMPORARY "easy access" mode — no login screen.
// Auto-signs-in as the Aspect tenant account so a real Supabase session
// exists (keeps RLS + tenant scoping working). Remove this route and restore
// the /login flow when real auth is wanted again.
const AUTO_EMAIL = 'hafnas008@gmail.com';
const AUTO_PASSWORD = 'aspect12345';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();

  if (!user) {
    const { error } = await supa.auth.signInWithPassword({
      email: AUTO_EMAIL,
      password: AUTO_PASSWORD,
    });
    if (error) {
      return NextResponse.json(
        { error: 'auto-login failed', detail: error.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.redirect(new URL('/home', request.url));
}
