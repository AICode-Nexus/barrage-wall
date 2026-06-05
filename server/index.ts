import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBarrageServer } from './app.js'

const port = Number(process.env.PORT ?? 8080)
const dataDir = process.env.DATA_DIR ?? resolve(process.cwd(), 'data')
const defaultStaticDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../dist')
const staticDir = process.env.STATIC_DIR ?? (existsSync(resolve(defaultStaticDir, 'index.html')) ? defaultStaticDir : null)

const { httpServer } = createBarrageServer({ dataDir, staticDir })

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Barrage wall is running at http://0.0.0.0:${port}`)
})
