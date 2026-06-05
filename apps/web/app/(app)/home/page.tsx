import { supabaseServer } from '@/lib/supabase/server';
import { ModuleTile } from '@/components/shell/ModuleTile';
import { CostingIcon, QuotationIcon, InvoiceIcon, PlusIcon } from '@/components/shell/icons';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();

  let company = 'Documentation Studio';
  if (user) {
    const { data: m } = await supa
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (m) {
      const { data: tenant } = await supa
        .from('tenants')
        .select('company_name')
        .eq('id', m.tenant_id)
        .maybeSingle();
      if (tenant?.company_name) company = tenant.company_name;
    }
  }

  return (
    <div>
      {/* App bar */}
      <header className="px-5 pt-8 pb-5">
        <p className="num text-xs uppercase tracking-[0.18em] text-caramel-600">Documentation Studio</p>
        <h1 className="font-display text-2xl font-bold leading-tight text-brown-900">{company}</h1>
        <div className="rule mt-4" />
      </header>

      {/* Module grid */}
      <section className="px-5">
        <p className="mb-3 text-sm font-medium text-brown-500">What do you want to create?</p>
        <div className="grid grid-cols-2 gap-4">
          <ModuleTile index={0} href="/costing" label="Make Costing" hint="Photo · voice · sheet" icon={<CostingIcon />} />
          <ModuleTile index={1} href="/quotation" label="Make Quotation" hint="Coming soon" icon={<QuotationIcon />} />
          <ModuleTile index={2} href="/invoice" label="Make Invoice" hint="Coming soon" icon={<InvoiceIcon />} />
          <ModuleTile index={3} href="#" label="More" hint="Soon" icon={<PlusIcon />} disabled />
        </div>
      </section>
    </div>
  );
}
