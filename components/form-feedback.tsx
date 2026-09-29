import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  )
}

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="rounded-md border border-[#2f6b4f]/20 bg-[#2f6b4f]/10 px-3 py-2 text-sm text-[#1e4a34]">
      {message}
    </p>
  )
}
