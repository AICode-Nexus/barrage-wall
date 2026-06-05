// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { onRequestGet, onRequestPost } from './index.js'

type EdgeOneKV = {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
}

type EdgeOneContext = {
  request: Request
  params: {
    roomId?: string
  }
  env: {
    BARRAGE_KV: EdgeOneKV
  }
}

class MemoryKV implements EdgeOneKV {
  private readonly values = new Map<string, string>()

  async get(key: string) {
    expect(key).toMatch(/^[A-Za-z0-9_]+$/)
    return this.values.get(key) ?? null
  }

  async put(key: string, value: string) {
    expect(key).toMatch(/^[A-Za-z0-9_]+$/)
    this.values.set(key, value)
  }
}

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>
}

function createContext(
  request: Request,
  kv = new MemoryKV(),
  params = { roomId: 'room-a1b2c3d4' },
): EdgeOneContext {
  return {
    request,
    params,
    env: {
      BARRAGE_KV: kv,
    },
  }
}

describe('EdgeOne messages function', () => {
  it('stores a normalized message and returns recent room messages', async () => {
    const kv = new MemoryKV()

    const post = await onRequestPost(
      createContext(
        new Request('https://example.com/api/rooms/room-a1b2c3d4/messages', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.20' },
          body: JSON.stringify({ body: '  EdgeOne 现场可用  ', nickname: '  主持人  ' }),
        }),
        kv,
      ),
    )

    expect(post.status).toBe(201)
    expect(await readJson(post)).toMatchObject({
      message: {
        roomId: 'room-a1b2c3d4',
        body: 'EdgeOne 现场可用',
        nickname: '主持人',
      },
    })

    const get = await onRequestGet(
      createContext(new Request('https://example.com/api/rooms/room-a1b2c3d4/messages'), kv),
    )

    expect(get.status).toBe(200)
    expect(await readJson(get)).toMatchObject({
      messages: [
        {
          roomId: 'room-a1b2c3d4',
          body: 'EdgeOne 现场可用',
          nickname: '主持人',
        },
      ],
    })
  })

  it('rejects invalid content and rapid duplicate posts', async () => {
    const kv = new MemoryKV()

    const invalid = await onRequestPost(
      createContext(
        new Request('https://example.com/api/rooms/room-a1b2c3d4/messages', {
          method: 'POST',
          body: JSON.stringify({ body: ' ' }),
        }),
        kv,
      ),
    )

    expect(invalid.status).toBe(422)
    expect(await readJson(invalid)).toEqual({
      error: {
        field: 'body',
        message: '弹幕内容不能为空',
      },
    })

    const first = await onRequestPost(
      createContext(
        new Request('https://example.com/api/rooms/room-a1b2c3d4/messages', {
          method: 'POST',
          headers: { 'x-forwarded-for': '203.0.113.21' },
          body: JSON.stringify({ body: '第一条' }),
        }),
        kv,
      ),
    )
    expect(first.status).toBe(201)

    const second = await onRequestPost(
      createContext(
        new Request('https://example.com/api/rooms/room-a1b2c3d4/messages', {
          method: 'POST',
          headers: { 'x-forwarded-for': '203.0.113.21' },
          body: JSON.stringify({ body: '第二条' }),
        }),
        kv,
      ),
    )

    expect(second.status).toBe(429)
    expect(await readJson(second)).toEqual({
      error: {
        message: '发送太快了，请稍后再试',
      },
    })
  })

  it('returns a clear error when KV is not bound', async () => {
    const response = await onRequestGet({
      request: new Request('https://example.com/api/rooms/room-a1b2c3d4/messages'),
      params: { roomId: 'room-a1b2c3d4' },
      env: {},
    } as EdgeOneContext)

    expect(response.status).toBe(500)
    expect(await readJson(response)).toEqual({
      error: {
        message: 'KV 未绑定，请在 EdgeOne Pages 中绑定 BARRAGE_KV',
      },
    })
  })
})
