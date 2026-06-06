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

type LocationLike = Pick<Location, 'origin' | 'pathname' | 'search'>

function createBaseUrl(location: LocationLike, baseUrl?: string) {
  if (!baseUrl?.trim()) {
    return `${location.origin}${location.pathname}${location.search}`
  }

  try {
    const parsed = new URL(baseUrl.trim())
    return `${parsed.origin}${parsed.pathname}${parsed.search}`
  } catch {
    return `${location.origin}${location.pathname}${location.search}`
  }
}

export function buildHashUrl(location: LocationLike, hash: string, baseUrl?: string) {
  return `${createBaseUrl(location, baseUrl)}${hash}`
}

export function buildSendUrl(location: LocationLike, roomId: string, baseUrl?: string) {
  return buildHashUrl(location, createSendHash(roomId), baseUrl)
}
