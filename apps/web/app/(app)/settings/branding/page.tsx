import { supabaseServer } from '@/lib/supabase/server';
import BrandingForm from '@/components/branding/BrandingForm';

export default async function BrandingPage() {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  const { data: membership } = await supa.from('tenant_users').select('tenant_id').eq('user_id', user!.id).single();
  const { data: tenant } = await supa.from('tenants').select('*').eq('id', membership!.tenant_id).single();
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-1">Branding</h1>
      <p className="text-sm text-ink-800/70 mb-6">These details appear on every generated Costing Sheet.</p>
      <BrandingForm initial={tenant!} />
    </div>
  );
}
