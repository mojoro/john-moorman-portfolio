import { DeleteInvoiceButton } from "./delete-invoice-button"
import { requireAdminPage } from "@/lib/admin/require-admin-page"
import { getInvoices } from "@/lib/invoicing/db"
import { formatEur, formatHours } from "@/lib/invoicing/grouping"

export const runtime = "nodejs"

export default async function InvoicesPage() {
  await requireAdminPage()
  const invoices = await getInvoices()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Invoices <span className="font-mono text-base font-normal text-text-muted">({invoices.length})</span>
        </h1>
        <p className="mt-1 text-sm text-text-secondary">Issued invoice PDFs stored in Vercel Blob.</p>
      </div>

      <div className="overflow-hidden rounded-lg bg-bg-surface shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5),0_1px_0_rgba(10,25,47,0.04)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-elevated/40 font-mono text-xs text-text-muted">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3 text-right">Hours</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">PDF</th>
              <th className="px-4 py-3"> </th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center font-mono text-xs text-text-muted">
                  No invoices yet.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr id={`invoice-${invoice.id}`} key={invoice.id} className="transition-colors hover:bg-bg-elevated/25">
                  <td className="px-4 py-3 font-mono text-xs text-text-primary">{invoice.invoice_no}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{invoice.issued_date}</td>
                  <td className="px-4 py-3 text-text-secondary">{invoice.client_name}</td>
                  <td className="px-4 py-3 text-text-secondary">{invoice.period_summary}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-text-primary">{formatHours(invoice.total_hours)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-text-primary">{formatEur(invoice.total_eur)}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80">
                      Open ↗
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteInvoiceButton invoiceId={invoice.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
