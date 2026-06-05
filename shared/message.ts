export const BODY_MAX_LENGTH = 80
export const NICKNAME_MAX_LENGTH = 16
export const ROOM_ID_PATTERN = /^room-[a-z0-9]{8}$/

export type MessageDraft = {
  body: string
  nickname?: string | null
}

export type NormalizedDraft = {
  body: string
  nickname: string | null
}

export type ClientMessage = {
  id: string
  roomId: string
  body: string
  nickname: string | null
  createdAt: string
}

export type DraftValidation =
  | { valid: true; value: NormalizedDraft }
  | { valid: false; field: 'body' | 'nickname'; message: string }

export function createRoomId() {
  const randomValues = new Uint8Array(8)

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(randomValues)
  } else {
    for (let index = 0; index < randomValues.length; index += 1) {
      randomValues[index] = Math.floor(Math.random() * 256)
    }
  }

  const suffix = Array.from(randomValues)
    .map((value) => (value % 36).toString(36))
    .join('')

  return `room-${suffix}`
}

export function isValidRoomId(roomId: string) {
  return ROOM_ID_PATTERN.test(roomId)
}

export function normalizeDraft(draft: MessageDraft): NormalizedDraft {
  const body = draft.body.trim()
  const nickname = draft.nickname?.trim()

  return {
    body,
    nickname: nickname ? nickname : null,
  }
}

export function validateDraft(draft: MessageDraft): DraftValidation {
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

type CreateClientMessageOptions = MessageDraft & {
  roomId: string
  now?: () => Date
  id?: () => string
}

export function createClientMessage({
  roomId,
  body,
  nickname,
  now = () => new Date(),
  id = createMessageId,
}: CreateClientMessageOptions): ClientMessage {
  const validation = validateDraft({ body, nickname })

  if (!validation.valid) {
    throw new Error(validation.message)
  }

  return {
    id: id(),
    roomId,
    body: validation.value.body,
    nickname: validation.value.nickname,
    createdAt: now().toISOString(),
  }
}

function createMessageId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
