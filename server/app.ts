import { createServer, type Server } from 'node:http'
import express from 'express'
import { WebSocketServer, type WebSocket } from 'ws'
import { isValidRoomId, validateDraft, type ClientMessage } from '../shared/message.js'
import { MessageStore } from './store.js'

type CreateBarrageServerOptions = {
  dataDir: string
  staticDir: string | null
}

type RoomClient = {
  roomId: string
  socket: WebSocket
}

const POST_COOLDOWN_MS = 2000

export function createBarrageServer({ dataDir, staticDir }: CreateBarrageServerOptions) {
  const app = express()
  const store = new MessageStore(dataDir)
  const clients = new Set<RoomClient>()
  const lastPostByClient = new Map<string, number>()

  app.use(express.json({ limit: '16kb' }))

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true })
  })

  app.get('/api/rooms/:roomId/messages', async (request, response, next) => {
    try {
      const { roomId } = request.params

      if (!isValidRoomId(roomId)) {
        response.status(404).json({ error: { message: '房间不存在' } })
        return
      }

      const messages = await store.getRecent(roomId, 100)
      response.json({ messages })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/rooms/:roomId/messages', async (request, response, next) => {
    try {
      const { roomId } = request.params

      if (!isValidRoomId(roomId)) {
        response.status(404).json({ error: { message: '房间不存在' } })
        return
      }

      const validation = validateDraft({
        body: typeof request.body?.body === 'string' ? request.body.body : '',
        nickname: typeof request.body?.nickname === 'string' ? request.body.nickname : null,
      })

      if (!validation.valid) {
        response.status(422).json({
          error: {
            field: validation.field,
            message: validation.message,
          },
        })
        return
      }

      const rateLimitKey = `${roomId}:${request.ip ?? request.socket.remoteAddress ?? 'unknown'}`
      const now = Date.now()
      const lastPostAt = lastPostByClient.get(rateLimitKey) ?? 0

      if (now - lastPostAt < POST_COOLDOWN_MS) {
        response.status(429).json({
          error: {
            message: '发送太快了，请稍后再试',
          },
        })
        return
      }

      lastPostByClient.set(rateLimitKey, now)
      const message = await store.add({
        roomId,
        body: validation.value.body,
        nickname: validation.value.nickname,
      })

      broadcastMessage(clients, roomId, message)
      response.status(201).json({ message })
    } catch (error) {
      next(error)
    }
  })

  if (staticDir) {
    app.use(express.static(staticDir))
    app.get(/.*/, (_request, response) => {
      response.sendFile('index.html', { root: staticDir })
    })
  }

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction,
    ) => {
      void _next
      console.error(error)
      response.status(500).json({ error: { message: '服务暂时不可用' } })
    },
  )

  const httpServer = createServer(app)
  const webSocketServer = new WebSocketServer({ server: httpServer, path: '/ws' })

  webSocketServer.on('connection', (socket, request) => {
    const url = new URL(request.url ?? '/ws', 'http://localhost')
    const roomId = url.searchParams.get('roomId') ?? ''

    if (!isValidRoomId(roomId)) {
      socket.close(1008, 'Invalid room')
      return
    }

    const client = { roomId, socket }
    clients.add(client)
    socket.send(JSON.stringify({ type: 'ready', roomId }))

    socket.on('close', () => {
      clients.delete(client)
    })
  })

  return {
    app,
    httpServer,
    async close() {
      for (const client of clients) {
        client.socket.terminate()
      }
      await closeWebSocketServer(webSocketServer)
      await closeHttpServer(httpServer)
    },
  }
}

function broadcastMessage(clients: Set<RoomClient>, roomId: string, message: ClientMessage) {
  const payload = JSON.stringify({
    type: 'message',
    message,
  })

  for (const client of clients) {
    if (client.roomId === roomId && client.socket.readyState === client.socket.OPEN) {
      client.socket.send(payload)
    }
  }
}

function closeHttpServer(httpServer: Server) {
  return new Promise<void>((resolve, reject) => {
    if (!httpServer.listening) {
      resolve()
      return
    }

    httpServer.close((error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

function closeWebSocketServer(webSocketServer: WebSocketServer) {
  return new Promise<void>((resolve, reject) => {
    webSocketServer.close((error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
