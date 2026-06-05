import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createClientMessage, type ClientMessage, type MessageDraft } from '../shared/message.js'

type StoreFile = {
  messages: ClientMessage[]
}

export class MessageStore {
  private readonly filePath: string
  private writeQueue = Promise.resolve()

  constructor(private readonly dataDir: string) {
    this.filePath = join(dataDir, 'messages.json')
  }

  async add(draft: MessageDraft & { roomId: string }) {
    return this.withWriteLock(async () => {
      const data = await this.readData()
      const message = createClientMessage(draft)
      data.messages.push(message)

      await this.writeData({
        messages: data.messages.slice(-2000),
      })

      return message
    })
  }

  async getRecent(roomId: string, limit: number) {
    const data = await this.readData()

    return data.messages
      .filter((message) => message.roomId === roomId)
      .slice(-limit)
  }

  private async withWriteLock<T>(operation: () => Promise<T>) {
    const next = this.writeQueue.then(operation, operation)
    this.writeQueue = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }

  private async readData(): Promise<StoreFile> {
    try {
      const raw = await readFile(this.filePath, 'utf8')
      const parsed = JSON.parse(raw) as StoreFile

      return {
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { messages: [] }
      }

      throw error
    }
  }

  private async writeData(data: StoreFile) {
    await mkdir(this.dataDir, { recursive: true })
    await writeFile(this.filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  }
}
