import { z } from "zod"

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
    .refine((value) => value === "" || /^\d{4}$/.test(value), {
      message: "Vul een jaartal in, bijvoorbeeld 2019.",
    })
    .refine((value) => value === "" || (Number(value) >= 1900 && Number(value) <= 2100), {
      message: "Vul een jaartal tussen 1900 en 2100 in.",
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
    if (value.endsAt && value.endsAt <= value.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "Het eindtijdstip moet na het begin liggen.",
      })
    }
  })

export const albumSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Vul een naam voor de map in." })
    .max(80, { message: "De naam van de map is te lang." }),
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
