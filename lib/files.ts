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

export async function storeUpload(file: File, folder: "members" | "documents" | "photos", extension: string) {
  const storedName = `${crypto.randomUUID()}${extension}`
  const directory = path.join(UPLOAD_ROOT, folder)
  await mkdir(directory, { recursive: true })
  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(directory, storedName), bytes)
  return {
    storagePath: `${folder}/${storedName}`,
    sizeBytes: bytes.length,
  }
}
