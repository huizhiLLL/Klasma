export type Collection = 'tools' | 'projects' | 'library'
export type Route =
  | { kind: 'home'; search: string }
  | { kind: 'admin'; search: string }
  | { kind: 'resource'; slug: string; search: string }
  | { kind: Collection; slug?: string; category?: string; search: string }
  | { kind: 'missing'; search: string }

export function canonicalPath(href: string): string {
  const url = new URL(href, 'https://klasma.local')
  const legacy = url.pathname === '/' && url.searchParams.get('type')
  if (legacy && ['tools', 'projects', 'library'].includes(legacy)) {
    url.searchParams.delete('type')
    return `/${legacy}${url.search}${url.hash}`
  }
  return `${url.pathname}${url.search}${url.hash}`
}

export function parseRoute(href: string): Route {
  const url = new URL(canonicalPath(href), 'https://klasma.local')
  const search = url.search
  let parts: string[]
  try {
    parts = url.pathname.replace(/\/$/, '').split('/').slice(1).map(decodeURIComponent)
  } catch { return { kind: 'missing', search } }
  if (parts.some(part => part.includes('/') || part === '.' || part === '..')) return { kind: 'missing', search }
  if (url.pathname === '/') return url.searchParams.has('type') ? { kind: 'missing', search } : { kind: 'home', search }
  if (parts[0] === 'admin' && parts.length === 1) return { kind: 'admin', search }
  if (parts[0] === 'resource' && parts.length === 2 && parts[1]) return { kind: 'resource', slug: parts[1], search }
  if (parts[0] === 'tools' || parts[0] === 'projects') {
    if (parts.length <= 2 && parts.every(Boolean)) return { kind: parts[0], slug: parts[1], search }
  }
  if (parts[0] === 'library' && parts.length <= 3 && parts.every(Boolean)) return { kind: 'library', category: parts[1], slug: parts[2], search }
  return { kind: 'missing', search }
}
