import { supabaseServer } from '@/lib/supabase/server';
import { GreetingHeader } from '@/components/shell/GreetingHeader';
import { DateStrip } from '@/components/shell/DateStrip';
import { SmartCommand } from '@/components/shell/SmartCommand';
import { ModuleCard } from '@/components/shell/ModuleCard';
import { Fab } from '@/components/shell/Fab';
import { CostingIcon, QuotationIcon, InvoiceIcon } from '@/components/shell/icons';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();

  let company = 'there';
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
    <div className="pb-4">
      <GreetingHeader company={company} />
      <DateStrip />

      <div className="mt-6">
        <SmartCommand />
      </div>

      <section className="mt-7 px-4">
        <div className="mb-3 flex items-end justify-between px-1">
          <h2 className="label">Documents</h2>
          <span className="label">03 modules</span>
        </div>
        <div className="flex flex-col gap-3">
          <ModuleCard index={0} href="/costing" label="Costing" desc="Estimate from a photo, voice note or sheet" icon={<CostingIcon />} status="ready" />
          <ModuleCard index={1} href="/quotation" label="Quotation" desc="Turn a costing into a client proposal" icon={<QuotationIcon />} status="soon" />
          <ModuleCard index={2} href="/invoice" label="Invoice" desc="Bill from an approved quotation" icon={<InvoiceIcon />} status="soon" />
        </div>
      </section>

      <Fab href="/costing" />
    </div>
  );
}
