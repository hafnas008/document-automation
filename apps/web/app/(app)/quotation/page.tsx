import { PageHeader } from '@/components/shell/PageHeader';
import { QuotationIcon } from '@/components/shell/icons';

export default function QuotationPage() {
  return (
    <div>
      <PageHeader title="Make Quotation" kicker="Module" />
      <section className="px-5">
        <div className="card flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-mist-100">
            <QuotationIcon className="h-7 w-7" />
          </span>
          <h2 className="font-display text-lg font-bold text-mist-100">Coming next</h2>
          <p className="max-w-xs text-sm text-ash-400">
            Quotation generation lands right after we finish the Costing module. It will pull figures
            straight from your costing sheets and render your company-branded proposal.
          </p>
        </div>
      </section>
    </div>
  );
}
