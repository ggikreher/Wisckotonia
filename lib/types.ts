export type Role = "DISPUUT" | "ADMIN"

export type BoardRole = "VOORZITTER" | "PENNINGMEESTER" | "SECRETARIS"

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
  memberSince: number | null
  boardRole: BoardRole | null
  hasPhoto: boolean
  updatedAt: string
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
