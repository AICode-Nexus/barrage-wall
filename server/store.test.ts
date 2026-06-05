// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { MessageStore } from './store'

const tempDirs: string[] = []

async function createTempDir() {
  const dir = await mkdtemp(join(tmpdir(), 'barrage-store-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('MessageStore', () => {
  it('persists messages by room and reloads them from disk', async () => {
    const dataDir = await createTempDir()
    const store = new MessageStore(dataDir)

    await store.add({
      roomId: 'room-a1b2c3d4',
      body: '第一条',
      nickname: null,
    })
    await store.add({
      roomId: 'room-e5f6g7h8',
      body: '另一个房间',
      nickname: 'Alice',
    })

    const reloaded = new MessageStore(dataDir)
    const messages = await reloaded.getRecent('room-a1b2c3d4', 100)

    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatchObject({
      roomId: 'room-a1b2c3d4',
      body: '第一条',
      nickname: null,
    })
  })

  it('returns the latest messages in chronological order', async () => {
    const dataDir = await createTempDir()
    const store = new MessageStore(dataDir)

    for (let index = 0; index < 105; index += 1) {
      await store.add({
        roomId: 'room-a1b2c3d4',
        body: `第 ${index} 条`,
        nickname: null,
      })
    }

    const messages = await store.getRecent('room-a1b2c3d4', 100)

    expect(messages).toHaveLength(100)
    expect(messages[0].body).toBe('第 5 条')
    expect(messages.at(-1)?.body).toBe('第 104 条')
  })
})
