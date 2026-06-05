import { AddTimesheetEntryForm } from "./add-timesheet-entry-form"
import { ImportTimesheetCsvForm } from "./import-timesheet-csv-form"
import { TimesheetTable } from "./timesheet-table"
import { requireAdminPage } from "@/lib/admin/require-admin-page"
import { getClients, getTimesheetEntries } from "@/lib/invoicing/db"

export const runtime = "nodejs"

export default async function TimesheetPage() {
  await requireAdminPage()
  const [clients, entries] = await Promise.all([getClients(), getTimesheetEntries({ includeInvoiced: true })])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Timesheet</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Track work entries, select uninvoiced rows, and generate a PDF invoice.
        </p>
      </div>

      <AddTimesheetEntryForm clients={clients} />
      <ImportTimesheetCsvForm clients={clients} />
      <TimesheetTable entries={entries} clients={clients} />
    </div>
  )
}
