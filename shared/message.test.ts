import { describe, expect, it } from 'vitest'
import {
  BODY_MAX_LENGTH,
  createClientMessage,
  createRoomId,
  isValidRoomId,
  NICKNAME_MAX_LENGTH,
  normalizeDraft,
  validateDraft,
} from './message'

describe('message rules', () => {
  it('creates room ids that are URL-safe and accepted by validation', () => {
    const roomId = createRoomId()

    expect(roomId).toMatch(/^room-[a-z0-9]{8}$/)
    expect(isValidRoomId(roomId)).toBe(true)
  })

  it('normalizes body and optional nickname before sending', () => {
    expect(
      normalizeDraft({
        body: '  大家晚上好  ',
        nickname: '  小张  ',
      }),
    ).toEqual({
      body: '大家晚上好',
      nickname: '小张',
    })

    expect(
      normalizeDraft({
        body: '  只发内容  ',
        nickname: '   ',
      }),
    ).toEqual({
      body: '只发内容',
      nickname: null,
    })
  })

  it('rejects empty body, long body, and long nickname', () => {
    expect(validateDraft({ body: ' ', nickname: '' })).toEqual({
      valid: false,
      field: 'body',
      message: '弹幕内容不能为空',
    })

    expect(validateDraft({ body: '好'.repeat(BODY_MAX_LENGTH + 1) })).toEqual({
      valid: false,
      field: 'body',
      message: `弹幕最多 ${BODY_MAX_LENGTH} 个字`,
    })

    expect(
      validateDraft({
        body: '加油',
        nickname: '名'.repeat(NICKNAME_MAX_LENGTH + 1),
      }),
    ).toEqual({
      valid: false,
      field: 'nickname',
      message: `昵称最多 ${NICKNAME_MAX_LENGTH} 个字`,
    })
  })

  it('creates a client-safe message payload', () => {
    const message = createClientMessage({
      roomId: 'room-a1b2c3d4',
      body: '  现场气氛拉满  ',
      nickname: '  主持人  ',
      now: () => new Date('2026-06-05T12:00:00.000Z'),
      id: () => 'message-1',
    })

    expect(message).toEqual({
      id: 'message-1',
      roomId: 'room-a1b2c3d4',
      body: '现场气氛拉满',
      nickname: '主持人',
      createdAt: '2026-06-05T12:00:00.000Z',
    })
  })
})
