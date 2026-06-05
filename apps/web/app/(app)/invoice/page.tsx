import { PageHeader } from '@/components/shell/PageHeader';
import { InvoiceIcon } from '@/components/shell/icons';

export default function InvoicePage() {
  return (
    <div>
      <PageHeader title="Make Invoice" kicker="Module" />
      <section className="px-5">
        <div className="card flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-mist-100">
            <InvoiceIcon className="h-7 w-7" />
          </span>
          <h2 className="font-display text-lg font-bold text-mist-100">Coming next</h2>
          <p className="max-w-xs text-sm text-ash-400">
            Invoice generation follows Quotation — producing your company-branded invoice PDF from an
            approved quotation or directly from a costing sheet.
          </p>
        </div>
      </section>
    </div>
  );
}
