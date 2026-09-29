import { roleLabel } from "@/lib/constants"
import type { Role } from "@/lib/types"
import { cn } from "@/lib/utils"

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        role === "ADMIN" ? "bg-primary/10 text-primary" : "bg-secondary text-foreground/75",
      )}
    >
      {roleLabel(role)}
    </span>
  )
}
