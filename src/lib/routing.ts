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

export function buildSendUrl(location: LocationLike, roomId: string) {
  return `${location.origin}${location.pathname}${location.search}${createSendHash(roomId)}`
}
