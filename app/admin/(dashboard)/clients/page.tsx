import { ClientForm } from "./client-form"
import { requireAdminPage } from "@/lib/admin/require-admin-page"
import { getClients } from "@/lib/invoicing/db"
import { formatEur } from "@/lib/invoicing/grouping"

export const runtime = "nodejs"

export default async function ClientsPage() {
  await requireAdminPage()
  const clients = await getClients()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Clients <span className="font-mono text-base font-normal text-text-muted">({clients.length})</span>
        </h1>
        <p className="mt-1 text-sm text-text-secondary">Manage invoice recipients and hourly rates.</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-text-primary">Add client</h2>
        <ClientForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-text-primary">Existing clients</h2>
        {clients.length === 0 ? (
          <p className="font-mono text-sm text-text-muted">No clients yet. Run the migration seed or add one above.</p>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <details key={client.id} className="rounded-lg bg-bg-surface p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5),0_1px_0_rgba(10,25,47,0.04)]">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold text-text-primary">{client.name}</p>
                      <p className="font-mono text-xs text-text-muted">
                        {client.invoice_prefix} · {formatEur(client.hourly_rate_eur)}/hour {client.ust_id ? `· ${client.ust_id}` : ""}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-accent">Edit</span>
                  </div>
                </summary>
                <div className="mt-4">
                  <ClientForm client={client} />
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
