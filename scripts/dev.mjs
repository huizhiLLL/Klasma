import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const node = process.execPath
const wrangler = path.join(root,'node_modules','wrangler','bin','wrangler.js')
const vite = path.join(root,'node_modules','vite','bin','vite.js')
const children = []

function start(label,command,args) {
  const child = spawn(node,[command,...args],{ cwd:root, env:process.env, stdio:'inherit', windowsHide:false })
  children.push(child)
  child.once('exit',(code,signal) => {
    if (children.some(item => item.exitCode === null)) return
    process.exitCode = code ?? (signal ? 1 : 0)
  })
  child.once('error',error => {
    console.error(`[${label}] ${error.message}`)
    stop(1)
  })
  return child
}

function stop(code = 0) {
  for (const child of children) {
    if (child.exitCode !== null || child.pid === undefined) continue
    if (process.platform === 'win32') spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{ stdio:'ignore', windowsHide:true })
    else child.kill('SIGTERM')
  }
  if (code) process.exitCode = code
}

process.once('SIGINT',() => stop())
process.once('SIGTERM',() => stop())

start('worker',wrangler,['dev','--remote','--port','8787'])
start('vite',vite,process.argv.slice(2))
