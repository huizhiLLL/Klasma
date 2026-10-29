export type Collection = 'tools' | 'projects' | 'library'
export type Route =
 | { kind:'home' | 'admin' | 'missing'; search:string }
 | { kind:Collection; slug?:string; category?:string; search:string }
export function parseRoute(href:string):Route {
 const url = new URL(href,'https://klasma.local')
 const search = url.search
 let parts:string[]
 try { parts = url.pathname.replace(/\/$/,'').split('/').slice(1).map(decodeURIComponent) }
 catch { return { kind:'missing',search } }
 if (parts.some(part => part.includes('/') || part === '.' || part === '..')) return { kind:'missing',search }
 if (url.pathname === '/') return { kind:'home',search }
 if (parts[0] === 'admin' && parts.length === 1) return { kind:'admin',search }
 if (parts[0] === 'tools' || parts[0] === 'projects') {
  if (parts.length <= 2 && parts.every(Boolean)) return { kind:parts[0],slug:parts[1],search }
 }
 if (parts[0] === 'library' && parts.length <= 3 && parts.every(Boolean)) return { kind:'library',category:parts[1],slug:parts[2],search }
 return { kind:'missing',search }
}
export function routePath(route:Route):string {
 if (route.kind === 'home' || route.kind === 'missing') return '/'
 return `/${route.kind}${'category' in route && route.category ? `/${encodeURIComponent(route.category)}` : ''}${'slug' in route && route.slug ? `/${encodeURIComponent(route.slug)}` : ''}`
}
