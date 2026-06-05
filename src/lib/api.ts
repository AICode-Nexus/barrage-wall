import type { ClientMessage, MessageDraft } from '../../shared/message'

export type BarrageApi = {
  getMessages(roomId: string): Promise<ClientMessage[]>
  sendMessage(roomId: string, draft: MessageDraft): Promise<ClientMessage>
}

export const api: BarrageApi = {
  async getMessages(roomId) {
    const response = await fetch(`/api/rooms/${roomId}/messages`)
    const data = (await readJsonResponse(response)) as { messages?: ClientMessage[] }

    if (!response.ok) {
      throw new Error('加载弹幕失败')
    }

    return data.messages ?? []
  },

  async sendMessage(roomId, draft) {
    const response = await fetch(`/api/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draft),
    })
    const data = (await readJsonResponse(response)) as {
      message?: ClientMessage
      error?: { message?: string }
    }

    if (!response.ok || !data.message) {
      throw new Error(data.error?.message ?? '发送失败，请稍后再试')
    }

    return data.message
  },
}

async function readJsonResponse(response: Response) {
  const text = await response.text()

  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return {
      error: {
        message: text.slice(0, 120),
      },
    }
  }
}
