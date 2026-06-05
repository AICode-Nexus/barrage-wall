import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ClientMessage } from '../../shared/message'
import { mergeMessagesById } from './polling'

describe('polling helpers', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('merges polled messages by id and keeps the latest window', () => {
    const current: ClientMessage[] = [
      {
        id: 'message-1',
        roomId: 'room-a1b2c3d4',
        body: '旧消息',
        nickname: null,
        createdAt: '2026-06-05T12:00:00.000Z',
      },
    ]
    const incoming: ClientMessage[] = [
      current[0],
      {
        id: 'message-2',
        roomId: 'room-a1b2c3d4',
        body: '新消息',
        nickname: 'Ada',
        createdAt: '2026-06-05T12:00:01.000Z',
      },
    ]

    expect(mergeMessagesById(current, incoming, 10)).toEqual(incoming)
  })

  it('keeps only the latest messages when the wall has too many', () => {
    const messages = Array.from({ length: 150 }, (_, index) => ({
      id: `message-${index}`,
      roomId: 'room-a1b2c3d4',
      body: `第 ${index} 条`,
      nickname: null,
      createdAt: new Date(2026, 5, 5, 12, 0, index).toISOString(),
    }))

    const merged = mergeMessagesById([], messages, 140)

    expect(merged).toHaveLength(140)
    expect(merged[0].id).toBe('message-10')
    expect(merged.at(-1)?.id).toBe('message-149')
  })
})
