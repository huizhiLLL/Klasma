import type { Bindings } from './types'
export const SESSION_SECONDS = 30 * 24 * 60 * 60
export const SESSION_COOKIE = 'klasma_session'
const encoder = new TextEncoder()
async function signingKey(secret:string) {
  return crypto.subtle.importKey('raw',encoder.encode(`klasma-session-v1:${secret}`),{ name:'HMAC',hash:'SHA-256' },false,['sign','verify'])
}
export async function createSession(secret:string, now = Date.now()) {
  const payload = `${Math.floor(now / 1000) + SESSION_SECONDS}.${crypto.randomUUID()}`
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC',await signingKey(secret),encoder.encode(payload)))
  return `${payload}.${Array.from(signature,value => value.toString(16).padStart(2,'0')).join('')}`
}
export async function validSession(token:string | undefined, secret:string | undefined, now = Date.now()) {
  if (!secret || !token) return false
  const match = /^(\d+)\.([a-f0-9-]{36})\.([a-f0-9]{64})$/.exec(token)
  if (!match || Number(match[1]) <= Math.floor(now / 1000) || Number(match[1]) > Math.floor(now / 1000) + SESSION_SECONDS) return false
  const bytes = Uint8Array.from(match[3].match(/../g)!,value => parseInt(value,16))
  return crypto.subtle.verify('HMAC',await signingKey(secret),bytes,encoder.encode(`${match[1]}.${match[2]}`))
}
export async function matchesKey(candidate:string, env:Bindings) {
  if (!env.ADMIN_KEY) return false
  const [a,b] = await Promise.all([candidate,env.ADMIN_KEY].map(value => crypto.subtle.digest('SHA-256',encoder.encode(value))))
  const right = new Uint8Array(b)
  return new Uint8Array(a).reduce((result,value,index) => result | (value ^ right[index]),0) === 0
}
