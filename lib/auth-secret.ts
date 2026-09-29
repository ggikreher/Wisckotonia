import { randomBytes } from "crypto"

const fallbackSecret = randomBytes(32).toString("hex")

/** Leest AUTH_SECRET pas tijdens het draaien, niet als lege waarde uit de build. */
export function authSecret() {
  const fromEnv = process.env["AUTH_SECRET"]
  if (typeof fromEnv === "string" && fromEnv.length > 0) return fromEnv
  return fallbackSecret
}
