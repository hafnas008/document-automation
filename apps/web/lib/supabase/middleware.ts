import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let res = NextResponse.next({ request });
  const supa = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          res = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supa.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;
  const isAuthPage = path === '/login';
  const isApi = path.startsWith('/api/');
  const isPublic = isAuthPage || path === '/' || path.startsWith('/_next') || path.startsWith('/favicon');

  // Easy-access mode: no login screen — bounce anonymous hits to auto-login.
  if (!user && !isPublic && !isApi) {
    url.pathname = '/api/auto-login';
    return NextResponse.redirect(url);
  }

  // First-login gate: signed in but no tenant_user row → /onboarding
  if (user && !isAuthPage && path !== '/onboarding' && !isApi) {
    const { data: membership } = await supa
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }

    // Branding is only required to actually generate a document (costing flow).
    // Home + other module pages stay reachable regardless.
    if (path.startsWith('/costing')) {
      const { data: tenant } = await supa
        .from('tenants')
        .select('company_name, logo_url, trn_number')
        .eq('id', membership.tenant_id)
        .maybeSingle();
      if (tenant && (!tenant.logo_url || !tenant.company_name || !tenant.trn_number)) {
        url.pathname = '/settings/branding';
        return NextResponse.redirect(url);
      }
    }
  }

  return res;
}
