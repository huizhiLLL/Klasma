import { useEffect } from 'react'
import { LayoutGroup, MotionConfig } from 'motion/react'
import { useRoute } from './app/routing'
import { CollectionShell } from './app/components/CollectionShell'
import { HomePage } from './app/pages/HomePage'
import { StatePanel } from './app/components/StatePanel'
import { LibraryPage } from './app/features/library/LibraryPage'
import { ProjectsPage } from './app/features/projects/ProjectsPage'
import { ToolsPage } from './app/features/tools/ToolsPage'
import { useMotionPolicy } from './app/animations/useMotionPolicy'
import './app/styles/public.css'
import './app/styles/visuals.css'
import './app/styles/content.css'
function App() {
 const route = useRoute()
 const { enabled } = useMotionPolicy()
 useEffect(() => {
  document.title = `Klasma · ${{ home:'碎片',tools:'软件',projects:'作品',library:'工程资产',missing:'未找到' }[route.kind]}`
  document.querySelector<HTMLElement>('[data-page-heading]')?.focus({ preventScroll:true })
 },[route.kind])
 let page
 if (route.kind === 'home') page = <HomePage />
 else if (route.kind === 'tools') page = <CollectionShell collection="tools"><ToolsPage slug={route.slug} search={route.search} /></CollectionShell>
 else if (route.kind === 'library') page = <CollectionShell collection="library"><LibraryPage category={route.category} slug={route.slug} search={route.search} /></CollectionShell>
 else if (route.kind === 'projects') page = <CollectionShell collection="projects"><ProjectsPage slug={route.slug} search={route.search} /></CollectionShell>
 else page = <main><StatePanel state="missing" /></main>
 return <div className="public-app"><a className="skip-link" href="#page-content">跳到内容</a><MotionConfig reducedMotion={enabled ? 'never' : 'always'}><LayoutGroup id="klasma"><div className="app-stage" id="page-content" tabIndex={-1}>{page}</div></LayoutGroup></MotionConfig></div>
}
export default App
