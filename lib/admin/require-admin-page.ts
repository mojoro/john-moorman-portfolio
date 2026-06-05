import { redirect } from "next/navigation"
import { isAuthenticated } from "@/lib/admin/auth"

export async function requireAdminPage(): Promise<void> {
  if (!(await isAuthenticated())) {
    redirect("/admin/login")
  }
}
