import { supabaseServer } from '@/lib/supabase/server';
import { SmartCommand } from '@/components/shell/SmartCommand';
import { ModuleCard } from '@/components/shell/ModuleCard';
import { CostingIcon, QuotationIcon, InvoiceIcon } from '@/components/shell/icons';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();

  let company = 'Documentation Studio';
  if (user) {
    const { data: m } = await supa
      .from('tenant_users').select('tenant_id').eq('user_id', user.id).maybeSingle();
    if (m) {
      const { data: tenant } = await supa
        .from('tenants').select('company_name').eq('id', m.tenant_id).maybeSingle();
      if (tenant?.company_name) company = tenant.company_name;
    }
  }

  return (
    <div className="pt-6">
      {/* status bar */}
      <div className="mb-2 flex items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-breathe rounded-full bg-mist-300" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-mist-200" />
          </span>
          <span className="label text-ash-400">System online</span>
        </div>
        <span className="label text-ash-500">{company}</span>
      </div>

      {/* smart command hero */}
      <SmartCommand />

      {/* module menu */}
      <section className="mt-7 px-4">
        <div className="mb-3 flex items-end justify-between px-1">
          <h2 className="label text-ash-400">Documents</h2>
          <span className="label text-ash-500">03 modules</span>
        </div>
        <div className="flex flex-col gap-3">
          <ModuleCard index={0} href="/costing" label="Costing" desc="Estimate from a photo, voice note or sheet" icon={<CostingIcon />} status="ready" />
          <ModuleCard index={1} href="/quotation" label="Quotation" desc="Turn a costing into a client proposal" icon={<QuotationIcon />} status="soon" />
          <ModuleCard index={2} href="/invoice" label="Invoice" desc="Bill from an approved quotation" icon={<InvoiceIcon />} status="soon" />
        </div>
      </section>
    </div>
  );
}
