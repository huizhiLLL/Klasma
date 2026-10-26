import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Resource = {
  id: string
  type: 'tools' | 'projects' | 'library'
  slug: string
  title: string
  summary: string
  content?: string
  status: 'draft' | 'published'
  links?: Array<{ id?: string; kind: string; url: string; label: string }>
  tags?: Array<{ slug: string; label: string }>
}

const sections = [
  { key: 'tools', label: 'Tools', description: '真正进入日常使用的工具与软件。' },
  { key: 'projects', label: 'Projects', description: '亲手制作、值得展示和继续维护的作品。' },
  { key: 'library', label: 'Library', description: '蓝图、脚本、流程图与其他可复用资产。' },
] as const

function App() {
  const [route, setRoute] = useState(window.location.pathname)

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  if (route === '/admin') return <AdminPage onBack={() => { window.history.pushState({}, '', '/'); setRoute('/') }} />
  if (route.startsWith('/resource/')) return <ResourceDetail slug={route.replace('/resource/', '')} onBack={() => { window.history.pushState({}, '', '/'); setRoute('/') }} />
  const type = new URLSearchParams(window.location.search).get('type') as Resource['type'] | null
  if (type) return <ResourceBrowser type={type} onBack={() => { window.history.pushState({}, '', '/'); setRoute('/') }} />
  return <CollectionHome onAdmin={() => { window.history.pushState({}, '', '/admin'); setRoute('/admin') }} />
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

function ResourceBrowser({ type, onBack }: { type: Resource['type']; onBack: () => void }) {
  const section = sections.find((item) => item.key === type) ?? sections[0]
  const [query, setQuery] = useState('')
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const search = query ? `&q=${encodeURIComponent(query)}` : ''
    fetch(`/api/resources?type=${type}${search}`)
      .then((response) => response.json() as Promise<{ data: Resource[] }>)
      .then(({ data }) => setResources(data))
      .finally(() => setLoading(false))
  }, [query, type])

  return (
    <main className="browser-shell">
      <header className="browser-header"><button className="text-button" type="button" onClick={onBack}>← Klasma</button><span className="eyebrow">{section.label}</span></header>
      <div className="browser-intro"><p className="kicker">Collection / {section.key}</p><h1>{section.description}</h1><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题或说明" aria-label="搜索资源" /></div>
      {loading ? <p className="empty-state">正在读取收藏…</p> : resources.length === 0 ? <p className="empty-state">这里还没有公开资源。</p> : <div className="resource-list">{resources.map((resource) => <a href={`/resource/${resource.slug}`} className="resource-row" key={resource.id}><span className="resource-type">{resource.type}</span><div><h2>{resource.title}</h2><p>{resource.summary || '暂无说明'}</p></div><span className="row-arrow">↗</span></a>)}</div>}
    </main>
  )
}

function ResourceDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const [resource, setResource] = useState<Resource | null>(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => { fetch(`/api/resources/${slug}`).then((response) => { if (!response.ok) throw new Error('missing'); return response.json() as Promise<{ data: Resource }> }).then(({ data }) => setResource(data)).catch(() => setMissing(true)) }, [slug])
  if (missing) return <main className="browser-shell"><button className="text-button" type="button" onClick={onBack}>← 返回</button><h1>没有找到这条资源。</h1></main>
  if (!resource) return <main className="browser-shell"><p className="empty-state">正在读取资源…</p></main>
  return <main className="detail-shell"><button className="text-button" type="button" onClick={onBack}>← 返回收藏</button><p className="kicker">{resource.type} / {resource.status}</p><h1>{resource.title}</h1><p className="detail-summary">{resource.summary}</p><div className="detail-content">{resource.content || '这条资源还没有补充详细内容。'}</div>{resource.links?.length ? <div className="detail-links">{resource.links.map((link) => <a href={link.url} target="_blank" rel="noreferrer" key={link.id ?? link.url}>{link.label || link.url} ↗</a>)}</div> : null}</main>
}

function AdminPage({ onBack }: { onBack: () => void }) {
  const [saved, setSaved] = useState<Resource[]>([])
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ type: 'tools', slug: '', title: '', summary: '', content: '', links: '', tags: '', status: 'draft' })

  const loadResources = () => fetch('/api/admin/resources').then((response) => response.json() as Promise<{ data: Resource[] }>).then(({ data }) => setSaved(data)).catch(() => setMessage('后台 API 尚未启动，先检查 Wrangler 开发服务器。'))
  useEffect(() => { void loadResources() }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('正在保存…')
    const response = await fetch(editingId ? `/api/admin/resources/${editingId}` : '/api/admin/resources', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: form.type,
        slug: form.slug,
        title: form.title,
        summary: form.summary,
        content: form.content,
        status: form.status,
        tagSlugs: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        links: form.links.split(',').map((url) => url.trim()).filter(Boolean).map((url) => ({ kind: 'website', url })),
      }),
    })
    if (!response.ok) { setMessage('保存失败，请检查字段和 Worker 日志。'); return }
    setMessage(editingId ? '已更新资源。' : '已保存到 D1。')
    setEditingId(null)
    setForm({ type: 'tools', slug: '', title: '', summary: '', content: '', links: '', tags: '', status: 'draft' })
    void loadResources()
  }

  const editResource = (resource: Resource) => {
    setEditingId(resource.id)
    setForm({
      type: resource.type,
      slug: resource.slug,
      title: resource.title,
      summary: resource.summary,
      content: resource.content ?? '',
      links: resource.links?.map((link) => link.url).join(', ') ?? '',
      tags: resource.tags?.map((tag) => tag.slug).join(', ') ?? '',
      status: resource.status,
    })
    setMessage('正在编辑已有资源。')
  }

  const deleteResource = async (resource: Resource) => {
    if (!window.confirm(`确定删除“${resource.title}”吗？`)) return
    const response = await fetch(`/api/admin/resources/${resource.id}`, { method: 'DELETE' })
    setMessage(response.ok ? '资源已删除。' : '删除失败，请检查 Worker 日志。')
    if (response.ok) void loadResources()
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
            <label>详细内容<textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="可以先写 Markdown，后续接入渲染" rows={6} /></label>
            <label>外部链接<input value={form.links} onChange={(event) => setForm({ ...form, links: event.target.value })} placeholder="多个链接用逗号分隔" /></label>
            <label>标签<input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="minecraft, sfm, automation" /></label>
            <label>状态<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">草稿</option><option value="published">发布</option></select></label>
            <div className="form-actions"><button className="save-button" type="submit">{editingId ? '更新资源' : '保存资源'} <span>↗</span></button>{editingId && <button className="text-button" type="button" onClick={() => { setEditingId(null); setForm({ type: 'tools', slug: '', title: '', summary: '', content: '', links: '', tags: '', status: 'draft' }) }}>取消编辑</button>}</div>
            {message && <p className="form-message" role="status">{message}</p>}
          </form>
        </section>
        <aside className="saved-panel">
          <p className="kicker">Current archive</p>
          <h2>已录入的资源</h2>
          {saved.length === 0 ? <p className="empty-state">还没有资源，先保存第一条。</p> : <ul>{saved.map((resource) => <li key={resource.id}><span>{resource.type} · {resource.status}</span><strong>{resource.title}</strong><small>{resource.summary || '没有摘要'}</small><div className="resource-actions"><button type="button" onClick={() => editResource(resource)}>编辑</button><button type="button" onClick={() => void deleteResource(resource)}>删除</button></div></li>)}</ul>}
        </aside>
      </div>
    </main>
  )
}

export default App
