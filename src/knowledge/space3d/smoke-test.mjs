import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const smokeDirectory = dirname(fileURLToPath(import.meta.url))
const projectDirectory = resolve(smokeDirectory, '..', '..', '..')
const server = await createServer({
  root: projectDirectory,
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
})

try {
  await server.ssrLoadModule('/src/knowledge/space3d/smoke-runner.ts')
} finally {
  await server.close()
}
