import { AdminPage } from './admin/AdminPage'
import { CollectionHome, ResourceBrowser, ResourceDetail } from './app/pages/LegacyResources'
import { navigate, useRoute } from './app/routing'
import { Link } from './app/components/Link'
import './app/styles/legacy.css'

function App() {
  const route = useRoute()
  const back = () => navigate('/')
  let page
  if (route.kind === 'admin') page = <AdminPage onBack={back} />
  else if (route.kind === 'resource') page = <ResourceDetail slug={route.slug} onBack={back} />
  else if (route.kind === 'home') page = <CollectionHome />
  else if (route.kind === 'tools' || route.kind === 'library') page = route.slug ? <ResourceDetail slug={route.slug} onBack={() => navigate(`/${route.kind}`)} /> : <ResourceBrowser type={route.kind} onBack={back} />
  else if (route.kind === 'projects' && !route.slug) page = <main className="browser-shell"><Link href="/">返回首页</Link><h1>What I make</h1><p>作品还在整理中。</p></main>
  else page = <main className="browser-shell"><Link href="/">返回首页</Link><h1>没有找到这个页面。</h1></main>
  return <div className="legacy-surface">{page}</div>
}

export default App
