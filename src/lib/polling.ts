import type { ClientMessage } from '../../shared/message'

export function mergeMessagesById(
  current: ClientMessage[],
  incoming: ClientMessage[],
  limit: number,
) {
  const byId = new Map<string, ClientMessage>()

  for (const message of current) {
    byId.set(message.id, message)
  }

  for (const message of incoming) {
    byId.set(message.id, message)
  }

  return Array.from(byId.values())
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-limit)
}
