import { describe, expect, it } from 'vitest'
import {
  buildSendUrl,
  createSendHash,
  createWallHash,
  parseHashRoute,
} from './routing'

describe('hash routing', () => {
  it('parses wall, send, and home routes', () => {
    expect(parseHashRoute('')).toEqual({ view: 'home' })
    expect(parseHashRoute('#/wall/room-a1b2c3d4')).toEqual({
      view: 'wall',
      roomId: 'room-a1b2c3d4',
    })
    expect(parseHashRoute('#/send/room-a1b2c3d4')).toEqual({
      view: 'send',
      roomId: 'room-a1b2c3d4',
    })
    expect(parseHashRoute('#/wall/not-valid')).toEqual({ view: 'not-found' })
  })

  it('creates hash paths for static hosting', () => {
    expect(createWallHash('room-a1b2c3d4')).toBe('#/wall/room-a1b2c3d4')
    expect(createSendHash('room-a1b2c3d4')).toBe('#/send/room-a1b2c3d4')
  })

  it('builds a QR target from the current page location', () => {
    expect(
      buildSendUrl(
        {
          origin: 'http://203.0.113.10:8080',
          pathname: '/show/',
          search: '?preview=1',
        },
        'room-a1b2c3d4',
      ),
    ).toBe('http://203.0.113.10:8080/show/?preview=1#/send/room-a1b2c3d4')
  })
})
