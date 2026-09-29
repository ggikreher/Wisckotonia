import { mkdir, unlink, writeFile } from "fs/promises"
import path from "path"

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads")

const IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
])

const DOCUMENT_TYPES = new Map<string, string>([
  ["application/pdf", ".pdf"],
  ["application/msword", ".doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
  ["application/vnd.ms-powerpoint", ".ppt"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", ".pptx"],
  ["application/vnd.ms-excel", ".xls"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx"],
  ["text/plain", ".txt"],
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
])

const EXTENSION_MIME = new Map<string, string>([
  [".pdf", "application/pdf"],
  [".doc", "application/msword"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".ppt", "application/vnd.ms-powerpoint"],
  [".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  [".xls", "application/vnd.ms-excel"],
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  [".txt", "text/plain"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
])

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024

export function resolveStoredFile(relativePath: string) {
  const full = path.resolve(UPLOAD_ROOT, relativePath)
  const relative = path.relative(UPLOAD_ROOT, full)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Ongeldig bestandspad")
  }
  return full
}

export function mimeFromPath(filePath: string) {
  return EXTENSION_MIME.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream"
}

export function sniffImageMime(bytes: Uint8Array, fallback: string) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png"
  }
  if (bytes.length >= 12) {
    const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end))
    if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp"
  }
  const head = new TextDecoder().decode(bytes.subarray(0, Math.min(bytes.length, 180))).trimStart()
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return "image/svg+xml"
  return fallback
}

/** Prisma verwacht een gewone Uint8Array, geen Node-buffer. */
export function prismaBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy
}

/** Kopieer de bytes. Een Node-buffer als response-body kan in productie leeg of ongeldig zijn. */
export function fileResponse(bytes: Uint8Array, contentType: string, extraHeaders?: Record<string, string>) {
  const body = Uint8Array.from(bytes)
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "private, no-cache",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  })
}

export function safeDownloadName(name: string) {
  const base = path.basename(name).replace(/[\\/:*?"<>|]/g, "_").trim()
  return base.slice(0, 140) || "document"
}

export async function removeStoredFile(relativePath: string | null | undefined) {
  if (!relativePath) return
  try {
    await unlink(resolveStoredFile(relativePath))
  } catch {
    // Het bestand is al weg.
  }
}

function extensionFromName(name: string) {
  const ext = path.extname(name).toLowerCase()
  if (ext === ".jpeg") return ".jpg"
  return ext
}

export function inspectImage(file: File): { error?: string; extension?: string } {
  if (file.size === 0) return {}
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "De foto mag maximaal 5 MB zijn." }
  }
  const fromType = IMAGE_TYPES.get(file.type)
  const fromName = extensionFromName(file.name)
  const extension = fromType ?? ([".jpg", ".png", ".webp"].includes(fromName) ? fromName : null)
  if (!extension) {
    return { error: "Gebruik een JPG-, PNG- of WebP-bestand." }
  }
  return { extension }
}

export function inspectDocument(file: File): { error?: string; extension?: string; mimeType?: string } {
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Kies een bestand om te uploaden." }
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { error: "Het bestand mag maximaal 10 MB zijn." }
  }
  const fromName = extensionFromName(file.name)
  const fromType = DOCUMENT_TYPES.get(file.type)
  const extension = fromType ?? (EXTENSION_MIME.has(fromName) && fromName !== ".svg" ? fromName : null)
  if (!extension || extension === ".svg") {
    return { error: "Dit bestandstype is niet toegestaan. Gebruik PDF, Office, tekst of een afbeelding." }
  }
  return { extension, mimeType: file.type || EXTENSION_MIME.get(extension) || "application/octet-stream" }
}

export async function storeUpload(
  file: File,
  folder: "members" | "documents" | "photos",
  extension: string,
  options?: { requireDisk?: boolean },
) {
  const storedName = `${crypto.randomUUID()}${extension}`
  const directory = path.join(UPLOAD_ROOT, folder)
  const bytes = new Uint8Array(await file.arrayBuffer())
  try {
    await mkdir(directory, { recursive: true })
    await writeFile(path.join(directory, storedName), bytes)
  } catch (error) {
    if (options?.requireDisk !== false) throw error
  }
  return {
    storagePath: `${folder}/${storedName}`,
    sizeBytes: bytes.length,
    bytes,
  }
}
