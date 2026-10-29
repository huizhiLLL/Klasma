import { useEffect, lazy, Suspense } from 'react'
import { LayoutGroup, MotionConfig } from 'motion/react'
import { navigate, useRoute } from './app/routing'
import { routePath } from './app/routes'
import { CollectionShell } from './app/components/CollectionShell'
import { HomePage } from './app/pages/HomePage'
import { PreviewNote } from './app/components/PreviewNote'
import { StatePanel } from './app/components/StatePanel'
import { SoftwareVisual, StructureVisual } from './app/components/Visual'
import { previewState } from './app/data/model'
import { useMotionPolicy } from './app/animations/useMotionPolicy'
import './admin/admin.css'
import './app/styles/public.css'
import './app/styles/visuals.css'
const Admin = lazy(() => import('./admin/AdminPage').then(module => ({ default:module.AdminPage })))
function App() {
 const route = useRoute()
 const { enabled } = useMotionPolicy()
 useEffect(() => {
  document.title = `Klasma · ${{ home:'碎片',tools:'软件',projects:'作品',library:'工程资产',admin:'管理',missing:'未找到' }[route.kind]}`
  document.querySelector<HTMLElement>('[data-page-heading]')?.focus({ preventScroll:true })
 },[route.kind])
 if (route.kind === 'admin') return <div className="admin-app"><Suspense fallback={<p>正在打开管理页…</p>}><Admin onBack={() => navigate('/')} /></Suspense></div>
 const state = previewState(route.search)
 let page
 if (route.kind === 'home') page = <HomePage />
 else if (route.kind === 'tools') page = <CollectionShell collection="tools">{state !== 'ready' ? <StatePanel state={state} back="/tools" /> : <div style={{ height:420 }}><SoftwareVisual title="Mole · 界面示意" /></div>}</CollectionShell>
 else if (route.kind === 'library') page = <CollectionShell collection="library">{state !== 'ready' ? <StatePanel state={state} back="/library" /> : <div style={{ height:420 }}><StructureVisual /></div>}</CollectionShell>
 else if (route.kind === 'projects') page = <CollectionShell collection="projects"><StatePanel state="empty" noun="作品" back="/" /></CollectionShell>
 else page = <main><StatePanel state="missing" /></main>
 return <div className="public-app"><a className="skip-link" href="#page-content">跳到内容</a><MotionConfig reducedMotion={enabled ? 'never' : 'always'}><LayoutGroup id="klasma"><div className="app-stage" id="page-content">{page}</div></LayoutGroup></MotionConfig><PreviewNote path={routePath(route)} search={route.search} /></div>
}
export default App
