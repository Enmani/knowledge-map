import { execFileSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_PORT = 4173
const DEFAULT_HOST = '127.0.0.1'

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js')
const port = Number.parseInt(process.env.DEV_PORT ?? String(DEFAULT_PORT), 10)
const host = process.env.DEV_HOST?.trim() || DEFAULT_HOST

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`DEV_PORT 必须是 1–65535 之间的整数，当前值为“${process.env.DEV_PORT}”。`)
}

if (!existsSync(viteCli)) {
  throw new Error('没有找到本地 Vite。请先运行 pnpm install。')
}

if (process.platform !== 'win32') {
  throw new Error('restart:quick 目前只支持 Windows。')
}

const escapedProjectRoot = projectRoot.replaceAll("'", "''")
const stopListenerScript = `
$ErrorActionPreference = 'Stop'
$projectRoot = '${escapedProjectRoot}'
$listeners = @(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue)
$processIds = @($listeners | Select-Object -ExpandProperty OwningProcess -Unique)

foreach ($processId in $processIds) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $processId"
  $isProjectVite = $process.Name -match '^node(?:\\.exe)?$' -and
    $process.CommandLine -and
    $process.CommandLine.IndexOf($projectRoot, [StringComparison]::OrdinalIgnoreCase) -ge 0 -and
    $process.CommandLine.IndexOf('vite', [StringComparison]::OrdinalIgnoreCase) -ge 0

  if (-not $isProjectVite) {
    Write-Error "端口 ${port} 被其他程序占用（PID $processId，$($process.Name)），已拒绝结束该进程。"
    exit 19
  }
}

foreach ($processId in $processIds) {
  Stop-Process -Id $processId -ErrorAction Stop
  Write-Host "已停止旧的开发服务器（PID $processId）。"
}
`

try {
  execFileSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command', stopListenerScript], {
    cwd: projectRoot,
    stdio: 'inherit',
  })
} catch (error) {
  if (error?.status === 19) process.exit(19)
  throw error
}

console.log(`正在启动 http://${host}:${port}/`)

const vite = spawn(process.execPath, [viteCli, '--host', host, '--port', String(port)], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
})

vite.on('exit', (code, signal) => {
  process.exitCode = signal ? 1 : code ?? 0
})

vite.on('error', (error) => {
  console.error(`开发服务器启动失败：${error.message}`)
  process.exitCode = 1
})
