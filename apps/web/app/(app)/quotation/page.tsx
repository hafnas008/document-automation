import { PageHeader } from '@/components/shell/PageHeader';
import { QuotationIcon } from '@/components/shell/icons';

export default function QuotationPage() {
  return (
    <div>
      <PageHeader title="Make Quotation" kicker="Module" />
      <section className="px-5">
        <div className="card flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brown-600 text-beige-50">
            <QuotationIcon className="h-7 w-7" />
          </span>
          <h2 className="font-display text-lg font-semibold text-brown-900">Coming next</h2>
          <p className="max-w-xs text-sm text-brown-500">
            Quotation generation lands right after we finish the Costing module. It will reuse the
            same inputs and pull figures straight from your costing sheets.
          </p>
        </div>
      </section>
    </div>
  );
}
