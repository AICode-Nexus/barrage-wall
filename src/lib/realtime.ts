import type { ClientMessage } from '../../shared/message'

type RealtimeHandlers = {
  onReady?: () => void
  onMessage: (message: ClientMessage) => void
  onStatus?: (status: 'connecting' | 'connected' | 'disconnected') => void
}

export function connectRoom(roomId: string, handlers: RealtimeHandlers) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const socket = new WebSocket(`${protocol}//${window.location.host}/ws?roomId=${roomId}`)

  handlers.onStatus?.('connecting')

  socket.addEventListener('open', () => {
    handlers.onStatus?.('connected')
  })

  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data as string) as
      | { type: 'ready'; roomId: string }
      | { type: 'message'; message: ClientMessage }

    if (data.type === 'ready') {
      handlers.onReady?.()
    }

    if (data.type === 'message') {
      handlers.onMessage(data.message)
    }
  })

  socket.addEventListener('close', () => {
    handlers.onStatus?.('disconnected')
  })

  return () => {
    socket.close()
  }
}
