import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const frontierDirectory = dirname(fileURLToPath(import.meta.url))
const projectDirectory = resolve(frontierDirectory, '..', '..')
const server = await createServer({
  root: projectDirectory,
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
})

try {
  await server.ssrLoadModule('/src/frontier/smoke-runner.ts')
} finally {
  await server.close()
}
