import { ToastProvider } from "@/components/admin/toast"
import { CircuitBgLazy } from "@/components/circuit-bg-lazy"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <CircuitBgLazy />
      {children}
    </ToastProvider>
  )
}
