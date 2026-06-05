// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises'
import type { Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import WebSocket from 'ws'
import { createBarrageServer } from './app'

const tempDirs: string[] = []

async function createTempDir() {
  const dir = await mkdtemp(join(tmpdir(), 'barrage-api-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

function nextJsonMessage(socket: WebSocket, type?: string) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const handleMessage = (data: WebSocket.RawData) => {
      try {
        const parsed = JSON.parse(data.toString()) as Record<string, unknown>
        if (type && parsed.type !== type) {
          socket.once('message', handleMessage)
          return
        }

        resolve(parsed)
      } catch (error) {
        reject(error)
      }
    }

    socket.once('message', handleMessage)
    socket.once('error', reject)
  })
}

function listen(server: Server) {
  return new Promise<number>((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Expected test server to listen on a random port'))
        return
      }

      resolve(address.port)
    })
  })
}

describe('barrage HTTP and realtime server', () => {
  it('accepts a valid message and broadcasts it to room subscribers', async () => {
    const dataDir = await createTempDir()
    const barrage = createBarrageServer({ dataDir, staticDir: null })
    const port = await listen(barrage.httpServer)

    const socket = new WebSocket(`ws://127.0.0.1:${port}/ws?roomId=room-a1b2c3d4`)
    expect(await nextJsonMessage(socket, 'ready')).toEqual({
      type: 'ready',
      roomId: 'room-a1b2c3d4',
    })

    const broadcastPromise = nextJsonMessage(socket, 'message')
    const response = await request(barrage.httpServer)
      .post('/api/rooms/room-a1b2c3d4/messages')
      .send({ body: '  欢迎来到现场  ', nickname: '  小王  ' })
      .expect(201)

    expect(response.body.message).toMatchObject({
      roomId: 'room-a1b2c3d4',
      body: '欢迎来到现场',
      nickname: '小王',
    })

    const broadcast = await broadcastPromise
    expect(broadcast).toMatchObject({
      type: 'message',
      message: {
        roomId: 'room-a1b2c3d4',
        body: '欢迎来到现场',
        nickname: '小王',
      },
    })

    socket.close()
    await barrage.close()
  })

  it('returns validation errors without storing invalid content', async () => {
    const dataDir = await createTempDir()
    const barrage = createBarrageServer({ dataDir, staticDir: null })

    await request(barrage.httpServer)
      .post('/api/rooms/room-a1b2c3d4/messages')
      .send({ body: ' ' })
      .expect(422, {
        error: {
          field: 'body',
          message: '弹幕内容不能为空',
        },
      })

    await request(barrage.httpServer)
      .get('/api/rooms/room-a1b2c3d4/messages')
      .expect(200, { messages: [] })

    await barrage.close()
  })

  it('rate limits rapid posts from the same client and room', async () => {
    const dataDir = await createTempDir()
    const barrage = createBarrageServer({ dataDir, staticDir: null })

    await request(barrage.httpServer)
      .post('/api/rooms/room-a1b2c3d4/messages')
      .send({ body: '第一条' })
      .expect(201)

    await request(barrage.httpServer)
      .post('/api/rooms/room-a1b2c3d4/messages')
      .send({ body: '第二条' })
      .expect(429, {
        error: {
          message: '发送太快了，请稍后再试',
        },
      })

    await barrage.close()
  })
})
