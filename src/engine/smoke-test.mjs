import { resolve } from 'node:path'
import { createServer } from 'vite'

const projectDirectory = resolve(import.meta.dirname, '..', '..')
const server = await createServer({
  root: projectDirectory,
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
})

try {
  await server.ssrLoadModule('/src/engine/smoke-runner.ts')
} finally {
  await server.close()
}
