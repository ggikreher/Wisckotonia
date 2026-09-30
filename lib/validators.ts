import { z } from "zod"
import { amsterdamLocalToDate, parseCalendarDate } from "@/lib/dates"

export function issueMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Controleer de invoer."
}

export const memberSchema = z.object({
  name: z.string().trim().min(2, { message: "Vul een naam in." }).max(80, { message: "De naam is te lang." }),
  title: z.string().trim().max(80, { message: "De titel is te lang." }),
  bio: z.string().trim().max(400, { message: "Houd de tekst onder 400 tekens." }),
  boardRole: z.enum(["", "VOORZITTER", "PENNINGMEESTER", "SECRETARIS"], {
    message: "Kies een geldige bestuursrol.",
  }),
  category: z.enum(["WISCKO", "LES_WISKO", "MALT_WISCKO"], {
    message: "Kies een categorie: Wiscko, Les-Wisko of Malt-Wiscko.",
  }),
  memberSince: z
    .string()
    .trim()
    .refine((value) => value === "" || parseCalendarDate(value) !== null, {
      message: "Vul een datum in, bijvoorbeeld 29/09/2019.",
    }),
  birthDate: z
    .string()
    .trim()
    .refine((value) => value === "" || parseCalendarDate(value) !== null, {
      message: "Vul een datum in, bijvoorbeeld 29/09/2000.",
    })
    .refine((value) => {
      if (!value) return true
      const date = parseCalendarDate(value)
      if (!date) return true
      const today = new Date()
      return date.getTime() <= Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    }, {
      message: "De geboortedatum kan niet in de toekomst liggen.",
    }),
})

export const eventSchema = z
  .object({
    title: z.string().trim().min(2, { message: "Vul een titel in." }).max(120, { message: "De titel is te lang." }),
    location: z.string().trim().min(2, { message: "Vul een locatie in." }).max(120, { message: "De locatie is te lang." }),
    description: z
      .string()
      .trim()
      .min(2, { message: "Vul een beschrijving in." })
      .max(2000, { message: "De beschrijving is te lang." }),
    startsAt: z.string().trim().min(1, { message: "Vul een datum en tijd in." }),
    endsAt: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    const start = amsterdamLocalToDate(value.startsAt)
    if (!start) {
      ctx.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: "Vul een datum en tijd in, bijvoorbeeld 29-09-2026 20:00.",
      })
      return
    }
    if (!value.endsAt) return
    const end = amsterdamLocalToDate(value.endsAt)
    if (!end) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "Vul een datum en tijd in, bijvoorbeeld 29-09-2026 23:00.",
      })
      return
    }
    if (end.getTime() <= start.getTime()) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "Het eindtijdstip moet na het begin liggen.",
      })
    }
  })

function parseAmountCents(value: string) {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".")
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const cents = Math.round(Number(normalized) * 100)
  if (!Number.isFinite(cents) || cents <= 0 || cents > 999999) return null
  return cents
}

export function declarationAmountCents(value: string) {
  return parseAmountCents(value)
}

function parseShopCents(value: string) {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".")
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const cents = Math.round(Number(normalized) * 100)
  if (!Number.isFinite(cents) || cents < 0 || cents > 99999999) return null
  return cents
}

function parseQuantity(value: string) {
  if (!/^\d+$/.test(value.trim())) return null
  const quantity = Number(value.trim())
  if (quantity > 9999) return null
  return quantity
}

export function shopItemPriceCents(value: string) {
  return parseShopCents(value)
}

export function shopItemQuantity(value: string) {
  return parseQuantity(value)
}

export const shopItemSchema = z.object({
  description: z
    .string()
    .trim()
    .min(2, { message: "Vul een omschrijving in." })
    .max(400, { message: "Houd de omschrijving onder 400 tekens." }),
  quantity: z.string().trim().refine((value) => parseQuantity(value) !== null, {
    message: "Vul een aantal in, bijvoorbeeld 3.",
  }),
  price: z.string().trim().refine((value) => parseShopCents(value) !== null, {
    message: "Vul de kosten in, bijvoorbeeld 12,50.",
  }),
})

export const sponsorLinkSchema = z.object({
  url: z
    .string()
    .trim()
    .refine((value) => {
      try {
        const url = new URL(value)
        return url.protocol === "https:" || url.protocol === "http:"
      } catch {
        return false
      }
    }, { message: "Vul een geldige link in, bijvoorbeeld https://example.com." }),
})

export const declarationSchema = z.object({
  amount: z.string().trim().refine((value) => parseAmountCents(value) !== null, {
    message: "Vul een bedrag in, bijvoorbeeld 12,50.",
  }),
  reason: z
    .string()
    .trim()
    .min(2, { message: "Vul een reden in." })
    .max(400, { message: "Houd de reden onder 400 tekens." }),
  bankAccount: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, "").toUpperCase())
    .refine((value) => /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(value), {
      message: "Vul een IBAN in, bijvoorbeeld NL00 BANK 0123 4567 89.",
    }),
  accountName: z
    .string()
    .trim()
    .min(2, { message: "Vul de tenaamstelling in." })
    .max(80, { message: "De tenaamstelling is te lang." }),
})

export const albumSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Vul een naam voor de map in." })
    .max(80, { message: "De naam van de map is te lang." }),
  eventDate: z
    .string()
    .trim()
    .refine((value) => value === "" || parseCalendarDate(value) !== null, {
      message: "Vul een datum in, bijvoorbeeld 29/09/2026.",
    }),
})

export const documentSchema = z.object({
  title: z.string().trim().min(2, { message: "Vul een titel in." }).max(140, { message: "De titel is te lang." }),
  category: z
    .string()
    .trim()
    .min(2, { message: "Kies of vul een categorie in." })
    .max(60, { message: "De categorie is te lang." }),
})

export const pointsChoiceSchema = z.object({
  choice: z.enum(
    [
      "",
      "WHISKY_KRACHTIG",
      "WHISKY_MEDIUM",
      "WHISKY_MILD",
      "WHISKY_VOL",
      "WHISKY_ARTIKEL",
      "KORTING_WEEKEND",
      "KORTING_KLEDING",
      "DUURDERE_FLES",
    ],
    { message: "Kies een geldige optie." },
  ),
  followUp: z.string().trim().max(500, { message: "Houd de vervolgvraag onder 500 tekens." }),
})

export const createUserSchema = z.object({
  name: z.string().trim().min(2, { message: "Vul een naam in." }).max(80, { message: "De naam is te lang." }),
  username: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_]{3,24}$/, {
      message: "Gebruikersnaam: 3–24 tekens, letters, cijfers of _.",
    }),
  email: z.string().trim().email({ message: "Vul een geldig e-mailadres in." }),
  password: z
    .string()
    .min(8, { message: "Het wachtwoord moet minstens 8 tekens zijn." })
    .max(72, { message: "Het wachtwoord mag maximaal 72 tekens zijn." }),
  role: z.enum(["DISPUUT", "ADMIN"], { message: "Kies een rol." }),
})

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, { message: "Vul een naam in." }).max(80, { message: "De naam is te lang." }),
  role: z.enum(["DISPUUT", "ADMIN"], { message: "Kies een rol." }),
  password: z
    .string()
    .max(72, { message: "Het wachtwoord mag maximaal 72 tekens zijn." })
    .refine((value) => value.length === 0 || value.length >= 8, {
      message: "Het nieuwe wachtwoord moet minstens 8 tekens zijn.",
    }),
})
