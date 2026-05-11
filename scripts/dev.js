// 同时启动后端（node --watch）和前端（vite）
import { spawn } from 'child_process'

function run(cmd, args, cwd, label, color) {
  const proc = spawn(cmd, args, { cwd, stdio: 'pipe', shell: true })
  proc.stdout.on('data', d => process.stdout.write(`\x1b[${color}m[${label}]\x1b[0m ${d}`))
  proc.stderr.on('data', d => process.stderr.write(`\x1b[${color}m[${label}]\x1b[0m ${d}`))
  proc.on('exit', code => { if (code) process.exit(code) })
  return proc
}

const root = new URL('..', import.meta.url).pathname

run('node', ['--watch', 'src/index.js'], root,        'backend', '36')
run('npm',  ['run', 'dev'],             root+'/client', 'frontend', '35')

process.on('SIGINT', () => process.exit(0))
