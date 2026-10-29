import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import type { Resource } from '../../shared/resource'

const sections = [
  { key: 'tools', label: 'Tools', description: '真正进入日常使用的工具与软件。' },
  { key: 'projects', label: 'Projects', description: '亲手制作、值得展示和继续维护的作品。' },
  { key: 'library', label: 'Library', description: '蓝图、脚本、流程图与其他可复用资产。' },
] as const

export function CollectionHome() {
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
      <header className="topline"><p className="eyebrow">KLASMA / PERSONAL COLLECTION</p></header>
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

export function ResourceBrowser({ type, onBack }: { type: Resource['type']; onBack: () => void }) {
  const section = sections.find((item) => item.key === type) ?? sections[0]
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('updated')
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const search = query ? `&q=${encodeURIComponent(query)}` : ''
    fetch(`/api/resources?type=${type}&sort=${sort}${search}`)
      .then((response) => response.json() as Promise<{ data: Resource[] }>)
      .then(({ data }) => setResources(data))
      .finally(() => setLoading(false))
  }, [query, sort, type])

  return (
    <main className="browser-shell">
      <header className="browser-header"><button className="text-button" type="button" onClick={onBack}>← Klasma</button><span className="eyebrow">{section.label}</span></header>
      <div className="browser-intro"><p className="kicker">Collection / {section.key}</p><h1>{section.description}</h1><div className="browser-controls"><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题或说明" aria-label="搜索资源" /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="排序"><option value="updated">最近整理</option><option value="title">按标题</option></select></div></div>
      {loading ? <p className="empty-state">正在读取收藏…</p> : resources.length === 0 ? <p className="empty-state">这里还没有公开资源。</p> : <div className="resource-list">{resources.map((resource) => <a href={`/resource/${resource.slug}`} className="resource-row" key={resource.id}><span className="resource-type">{resource.type}</span><div><h2>{resource.title}</h2><p>{resource.summary || '暂无说明'}</p></div><span className="row-arrow">↗</span></a>)}</div>}
    </main>
  )
}

export function ResourceDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const [resource, setResource] = useState<Resource | null>(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => { fetch(`/api/resources/${slug}`).then((response) => { if (!response.ok) throw new Error('missing'); return response.json() as Promise<{ data: Resource }> }).then(({ data }) => setResource(data)).catch(() => setMissing(true)) }, [slug])
  if (missing) return <main className="browser-shell"><button className="text-button" type="button" onClick={onBack}>← 返回</button><h1>没有找到这条资源。</h1></main>
  if (!resource) return <main className="browser-shell"><p className="empty-state">正在读取资源…</p></main>
  const contentHtml = DOMPurify.sanitize(marked.parse(resource.content || '这条资源还没有补充详细内容。', { async: false }))
  return <main className="detail-shell"><button className="text-button" type="button" onClick={onBack}>← 返回收藏</button><p className="kicker">{resource.type} / {resource.status}</p><h1>{resource.title}</h1><p className="detail-summary">{resource.summary}</p><div className="detail-content markdown-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />{resource.links?.length ? <div className="detail-links">{resource.links.map((link) => <a href={link.url} target="_blank" rel="noreferrer" key={link.id ?? link.url}>{link.label || link.url} ↗</a>)}</div> : null}{resource.assets?.length ? <div className="detail-links">{resource.assets.map((asset) => <a href={`/api/assets/${asset.id}`} target="_blank" rel="noreferrer" key={asset.id}>{asset.filename} ↓</a>)}</div> : null}</main>
}
