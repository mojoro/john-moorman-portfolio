import { AdminNav } from "@/components/admin/admin-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1100px] px-6 py-8">
        {children}
      </main>
    </>
  )
}
