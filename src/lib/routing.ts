import { isValidRoomId } from '../../shared/message'

export type AppRoute =
  | { view: 'home' }
  | { view: 'wall'; roomId: string }
  | { view: 'send'; roomId: string }
  | { view: 'not-found' }

export function parseHashRoute(hash: string): AppRoute {
  const normalized = hash.replace(/^#/, '')

  if (!normalized || normalized === '/') {
    return { view: 'home' }
  }

  const [, view, roomId] = normalized.split('/')

  if ((view === 'wall' || view === 'send') && roomId && isValidRoomId(roomId)) {
    return { view, roomId }
  }

  return { view: 'not-found' }
}

export function createWallHash(roomId: string) {
  return `#/wall/${roomId}`
}

export function createSendHash(roomId: string) {
  return `#/send/${roomId}`
}

export type LocationLike = Pick<Location, 'origin' | 'pathname' | 'search'>

function parseBaseUrl(location: LocationLike, baseUrl?: string) {
  const fallbackUrl = new URL(`${location.origin}${location.pathname}${location.search}`)

  if (!baseUrl?.trim()) {
    return fallbackUrl
  }

  try {
    return new URL(baseUrl.trim())
  } catch {
    return fallbackUrl
  }
}

export function buildHashUrl(location: LocationLike, hash: string, baseUrl?: string) {
  const parsed = parseBaseUrl(location, baseUrl)
  return `${parsed.origin}${parsed.pathname}${parsed.search}${hash}`
}

export function buildSendUrl(location: LocationLike, roomId: string, baseUrl?: string) {
  return buildHashUrl(location, createSendHash(roomId), baseUrl)
}

export function hasEdgeOnePreviewAccess(location: LocationLike, baseUrl?: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  const parsed = parseBaseUrl(location, baseUrl)

  if (!parsed.hostname.endsWith('.edgeone.cool')) {
    return true
  }

  const token = parsed.searchParams.get('eo_token')
  const previewTime = Number(parsed.searchParams.get('eo_time'))

  if (!token || !Number.isFinite(previewTime)) {
    return false
  }

  return previewTime > nowSeconds
}
