import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createCatalog } from './catalog'
import type { Resource } from '../../shared/resource'
export type CatalogState = { state:'ready' | 'loading' | 'error';resources:Resource[] }
/** Injectable data for server rendering checks; the application always fetches the API. */
export const CatalogContext = createContext<CatalogState | null>(null)
export function useCatalog(type:'tools' | 'library') {
 const injected = useContext(CatalogContext)
 const [result,setResult] = useState<CatalogState>({ state:'loading',resources:[] })
 useEffect(() => {
  if (injected) return
  const controller = new AbortController()
  void fetch(`/api/resources?type=${type}`,{ signal:controller.signal }).then(async response => {
   if (!response.ok) throw new Error('API unavailable')
   const body = await response.json() as { data:Resource[] }
   if (!Array.isArray(body.data)) throw new Error('Invalid response')
   if (!controller.signal.aborted) setResult({ state:'ready',resources:body.data })
  }).catch(() => { if (!controller.signal.aborted) setResult({ state:'error',resources:[] }) })
  return () => controller.abort()
 },[type,injected])
 const current = injected ?? result
 return { state:current.state,catalog:useMemo(() => createCatalog(current.resources),[current.resources]) }
}
