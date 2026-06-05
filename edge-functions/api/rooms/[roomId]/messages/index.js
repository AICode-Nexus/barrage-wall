const BODY_MAX_LENGTH = 80
const NICKNAME_MAX_LENGTH = 16
const ROOM_ID_PATTERN = /^room-[a-z0-9]{8}$/
const MAX_STORED_MESSAGES = 200
const RECENT_LIMIT = 100
const POST_COOLDOWN_MS = 2000

export async function onRequestGet(context) {
  const roomId = context.params.roomId ?? ''
  const kv = getKV(context)

  if (!kv) {
    return missingKVResponse()
  }

  if (!isValidRoomId(roomId)) {
    return json({ error: { message: '房间不存在' } }, 404)
  }

  const room = await readRoom(kv, roomId)
  return json({ messages: room.messages.slice(-RECENT_LIMIT) })
}

export async function onRequestPost(context) {
  const roomId = context.params.roomId ?? ''
  const kv = getKV(context)

  if (!kv) {
    return missingKVResponse()
  }

  if (!isValidRoomId(roomId)) {
    return json({ error: { message: '房间不存在' } }, 404)
  }

  const body = await readJsonBody(context.request)
  const validation = validateDraft({
    body: typeof body.body === 'string' ? body.body : '',
    nickname: typeof body.nickname === 'string' ? body.nickname : null,
  })

  if (!validation.valid) {
    return json(
      {
        error: {
          field: validation.field,
          message: validation.message,
        },
      },
      422,
    )
  }

  const clientKey = createClientKey(context.request, roomId)
  const lastPostAt = Number((await kv.get(clientKey)) ?? 0)
  const now = Date.now()

  if (now - lastPostAt < POST_COOLDOWN_MS) {
    return json({ error: { message: '发送太快了，请稍后再试' } }, 429)
  }

  const room = await readRoom(kv, roomId)
  const message = createClientMessage({
    roomId,
    body: validation.value.body,
    nickname: validation.value.nickname,
  })
  const nextRoom = {
    messages: [...room.messages, message].slice(-MAX_STORED_MESSAGES),
  }

  await kv.put(roomKey(roomId), JSON.stringify(nextRoom))
  await kv.put(clientKey, String(now), { expirationTtl: 10 })

  return json({ message }, 201)
}

async function readJsonBody(request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

async function readRoom(kv, roomId) {
  const raw = await kv.get(roomKey(roomId))

  if (!raw) {
    return { messages: [] }
  }

  try {
    const parsed = JSON.parse(raw)
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    }
  } catch {
    return { messages: [] }
  }
}

function getKV(context) {
  return context.env?.BARRAGE_KV ?? globalThis.BARRAGE_KV
}

function roomKey(roomId) {
  return `room_${safeKeyPart(roomId)}_messages`
}

function createClientKey(request, roomId) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const clientIp = forwardedFor || request.headers.get('cf-connecting-ip') || 'unknown'

  return `room_${safeKeyPart(roomId)}_client_${safeKeyPart(clientIp)}_cooldown`
}

function safeKeyPart(value) {
  return String(value).replace(/[^A-Za-z0-9_]/g, '_')
}

function isValidRoomId(roomId) {
  return ROOM_ID_PATTERN.test(roomId)
}

function normalizeDraft(draft) {
  const body = draft.body.trim()
  const nickname = draft.nickname?.trim()

  return {
    body,
    nickname: nickname ? nickname : null,
  }
}

function validateDraft(draft) {
  const value = normalizeDraft(draft)

  if (!value.body) {
    return {
      valid: false,
      field: 'body',
      message: '弹幕内容不能为空',
    }
  }

  if (value.body.length > BODY_MAX_LENGTH) {
    return {
      valid: false,
      field: 'body',
      message: `弹幕最多 ${BODY_MAX_LENGTH} 个字`,
    }
  }

  if (value.nickname && value.nickname.length > NICKNAME_MAX_LENGTH) {
    return {
      valid: false,
      field: 'nickname',
      message: `昵称最多 ${NICKNAME_MAX_LENGTH} 个字`,
    }
  }

  return {
    valid: true,
    value,
  }
}

function createClientMessage({ roomId, body, nickname }) {
  const validation = validateDraft({ body, nickname })

  if (!validation.valid) {
    throw new Error(validation.message)
  }

  return {
    id: createMessageId(),
    roomId,
    body: validation.value.body,
    nickname: validation.value.nickname,
    createdAt: new Date().toISOString(),
  }
}

function createMessageId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function missingKVResponse() {
  return json(
    {
      error: {
        message: 'KV 未绑定，请在 EdgeOne Pages 中绑定 BARRAGE_KV',
      },
    },
    500,
  )
}
