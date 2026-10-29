import { useSyncExternalStore } from 'react'
import { parseRoute } from './routes'

const navigationEvent = 'klasma:navigate'
const snapshot = () => window.location.pathname + window.location.search + window.location.hash
function subscribe(listener: () => void) {
  window.addEventListener('popstate', listener)
  window.addEventListener(navigationEvent, listener)
  return () => {
    window.removeEventListener('popstate', listener)
    window.removeEventListener(navigationEvent, listener)
  }
}

export function navigate(href: string, options: { replace?: boolean; preserveScroll?: boolean } = {}) {
  const url = new URL(href, window.location.href)
  if (url.origin !== window.location.origin) { window.location.assign(url.href); return }
  const next = url.pathname + url.search + url.hash
  if (next === snapshot()) return
  window.history[options.replace ? 'replaceState' : 'pushState']({}, '', next)
  window.dispatchEvent(new Event(navigationEvent))
  if (!options.preserveScroll) window.scrollTo({ top: 0, behavior: 'instant' })
}

export function useRoute() {
  const href = useSyncExternalStore(subscribe, snapshot, () => '/')
  return parseRoute(href)
}
