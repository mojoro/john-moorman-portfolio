import { AdminNav } from "@/components/admin/admin-nav"
import { ToastProvider } from "@/components/admin/toast"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}
