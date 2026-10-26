import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Resource = {
  id: string
  type: 'tools' | 'projects' | 'library'
  slug: string
  title: string
  summary: string
  status: 'draft' | 'published'
}

const sections = [
  { key: 'tools', label: 'Tools', description: '真正进入日常使用的工具与软件。' },
  { key: 'projects', label: 'Projects', description: '亲手制作、值得展示和继续维护的作品。' },
  { key: 'library', label: 'Library', description: '蓝图、脚本、流程图与其他可复用资产。' },
] as const

function App() {
  const [isAdmin, setIsAdmin] = useState(window.location.pathname === '/admin')

  useEffect(() => {
    const onPopState = () => setIsAdmin(window.location.pathname === '/admin')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  if (isAdmin) return <AdminPage onBack={() => { window.history.pushState({}, '', '/'); setIsAdmin(false) }} />
  return <CollectionHome onAdmin={() => { window.history.pushState({}, '', '/admin'); setIsAdmin(true) }} />
}

function CollectionHome({ onAdmin }: { onAdmin: () => void }) {
  const [resources, setResources] = useState<Resource[]>([])
  const [apiState, setApiState] = useState<'loading' | 'ready' | 'offline'>('loading')

  useEffect(() => {
    fetch('/api/resources')
      .then((response) => response.json() as Promise<{ data: Resource[] }>)
      .then(({ data }) => { setResources(data); setApiState('ready') })
      .catch(() => setApiState('offline'))
  }, [])

  return (
    <main className="shell">
      <header className="topline">
        <p className="eyebrow">KLASMA / PERSONAL COLLECTION</p>
        <button className="text-button" type="button" onClick={onAdmin}>管理入口 ↗</button>
      </header>
      <section className="intro">
        <p className="kicker">A small archive of useful things</p>
        <h1>拾起值得留下的碎片。</h1>
        <p>一个正在搭建中的个人资源库，保存我真正使用过、制作过和愿意分享的东西。</p>
      </section>
      <section className="collection-grid" aria-label="Klasma collections">
        {sections.map((section, index) => {
          const count = resources.filter((resource) => resource.type === section.key).length
          return (
            <a className={`collection-card card-${index + 1}`} href={`/?type=${section.key}`} key={section.key}>
              <span className="card-index">0{index + 1}</span>
              <span className="card-count">{count ? `${count} entries` : 'In progress'}</span>
              <h2>{section.label}</h2>
              <p>{section.description}</p>
              <span className="card-arrow" aria-hidden="true">↗</span>
            </a>
          )
        })}
      </section>
      <footer>
        <span>{apiState === 'ready' ? `${resources.length} published resources` : apiState === 'offline' ? 'API unavailable in this session' : 'Connecting to the archive'}</span>
        <span>Foundation phase · 2026</span>
      </footer>
    </main>
  )
}

function AdminPage({ onBack }: { onBack: () => void }) {
  const [saved, setSaved] = useState<Resource[]>([])
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ type: 'tools', slug: '', title: '', summary: '', status: 'draft' })

  const loadResources = () => fetch('/api/admin/resources').then((response) => response.json() as Promise<{ data: Resource[] }>).then(({ data }) => setSaved(data)).catch(() => setMessage('后台 API 尚未启动，先检查 Wrangler 开发服务器。'))
  useEffect(() => { void loadResources() }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('正在保存…')
    const response = await fetch('/api/admin/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!response.ok) { setMessage('保存失败，请检查字段和 Worker 日志。'); return }
    setMessage('已保存到 D1。')
    setForm({ type: 'tools', slug: '', title: '', summary: '', status: 'draft' })
    void loadResources()
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <button className="text-button" type="button" onClick={onBack}>← 返回前台</button>
        <span className="admin-label">Klasma / Admin</span>
      </header>
      <div className="admin-layout">
        <section>
          <p className="kicker">Resource editor</p>
          <h1>把新的碎片放进来。</h1>
          <form className="resource-form" onSubmit={submit}>
            <label>类型<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="tools">Tools</option><option value="projects">Projects</option><option value="library">Library</option></select></label>
            <label>Slug<input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="my-useful-tool" /></label>
            <label>标题<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="资源名称" /></label>
            <label>一句话说明<textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="为什么值得保留" rows={3} /></label>
            <label>状态<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">草稿</option><option value="published">发布</option></select></label>
            <button className="save-button" type="submit">保存资源 <span>↗</span></button>
            {message && <p className="form-message" role="status">{message}</p>}
          </form>
        </section>
        <aside className="saved-panel">
          <p className="kicker">Current archive</p>
          <h2>已录入的资源</h2>
          {saved.length === 0 ? <p className="empty-state">还没有资源，先保存第一条。</p> : <ul>{saved.map((resource) => <li key={resource.id}><span>{resource.type}</span><strong>{resource.title}</strong><small>{resource.status}</small></li>)}</ul>}
        </aside>
      </div>
    </main>
  )
}

export default App
