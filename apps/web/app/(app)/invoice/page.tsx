import { PageHeader } from '@/components/shell/PageHeader';
import { InvoiceIcon } from '@/components/shell/icons';

export default function InvoicePage() {
  return (
    <div>
      <PageHeader title="Make Invoice" kicker="Module" />
      <section className="px-5">
        <div className="card flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brown-600 text-beige-50">
            <InvoiceIcon className="h-7 w-7" />
          </span>
          <h2 className="font-display text-lg font-semibold text-brown-900">Coming next</h2>
          <p className="max-w-xs text-sm text-brown-500">
            Invoice generation will follow Quotation, producing your company-branded invoice PDF
            from an approved quotation or directly from a costing sheet.
          </p>
        </div>
      </section>
    </div>
  );
}
