"use client"

import { useActionState } from "react"
import { FormError } from "@/components/form-feedback"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authenticate } from "@/lib/actions/auth"

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(authenticate, {})

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="space-y-1.5">
        <label htmlFor="identifier" className="text-sm font-medium">
          Gebruikersnaam of e-mail
        </label>
        <Input id="identifier" name="identifier" autoComplete="username" required />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Wachtwoord
        </label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <FormError message={state.error} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Bezig met inloggen…" : "Inloggen"}
      </Button>
    </form>
  )
}
