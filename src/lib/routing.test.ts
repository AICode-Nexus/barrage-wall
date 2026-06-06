import { describe, expect, it } from 'vitest'
import {
  buildHashUrl,
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

  it('builds a QR target from a pasted EdgeOne preview link', () => {
    expect(
      buildSendUrl(
        {
          origin: 'https://barrage-wall.edgeone.cool',
          pathname: '/',
          search: '',
        },
        'room-a1b2c3d4',
        ' https://barrage-wall.edgeone.cool?eo_token=abc&eo_time=1780655333#/wall/room-old ',
      ),
    ).toBe('https://barrage-wall.edgeone.cool/?eo_token=abc&eo_time=1780655333#/send/room-a1b2c3d4')
  })

  it('keeps EdgeOne preview credentials before the hash when building any hash URL', () => {
    expect(
      buildHashUrl(
        {
          origin: 'https://barrage-wall.edgeone.cool',
          pathname: '/',
          search: '?eo_token=abc&eo_time=1780655333',
        },
        '#/wall/room-a1b2c3d4',
      ),
    ).toBe('https://barrage-wall.edgeone.cool/?eo_token=abc&eo_time=1780655333#/wall/room-a1b2c3d4')
  })
})
