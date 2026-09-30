export type Role = "DISPUUT" | "ADMIN"

export type BoardRole = "VOORZITTER" | "PENNINGMEESTER" | "SECRETARIS"

export type MemberCategory = "WISCKO" | "LES_WISKO" | "MALT_WISCKO"

export type PointsChoice =
  | "WHISKY_KRACHTIG"
  | "WHISKY_MEDIUM"
  | "WHISKY_MILD"
  | "WHISKY_VOL"
  | "WHISKY_ARTIKEL"
  | "KORTING_WEEKEND"
  | "KORTING_KLEDING"
  | "DUURDERE_FLES"

export type ActionState = {
  error?: string
  message?: string
  nonce?: number
}

export type MemberDTO = {
  id: string
  name: string
  title: string
  bio: string
  memberSince: string | null
  birthDate: string | null
  boardRole: BoardRole | null
  category: MemberCategory | null
  hasPhoto: boolean
  updatedAt: string
}

export type BirthdayDTO = {
  id: string
  name: string
  year: number
  month: number
  day: number
}

export type EventDTO = {
  id: string
  title: string
  description: string
  location: string
  startsAt: string
  endsAt: string | null
  createdByName: string | null
  canManage: boolean
}

export type AlbumDTO = {
  id: string
  name: string
  eventDate: string | null
  photoCount: number
  coverPhotoId: string | null
  createdByName: string | null
  canManage: boolean
}

export type PhotoDTO = {
  id: string
  createdByName: string | null
  canDelete: boolean
}

export type DocumentDTO = {
  id: string
  title: string
  category: string
  fileName: string
  sizeBytes: number
  createdAt: string
}

export type UserDTO = {
  id: string
  name: string
  username: string
  email: string
  role: Role
  createdAt: string
}

export type SessionUser = {
  name: string
  username: string
  role: Role
}
