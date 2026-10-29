import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Resource } from '../shared/resource'

export function AdminPage({ onBack }: { onBack: () => void }) {
  const [saved, setSaved] = useState<Resource[]>([])
  const [message, setMessage] = useState('')
  const [adminKey, setAdminKey] = useState(() => window.localStorage.getItem('klasma_admin_key') ?? '')
  const [authNeeded, setAuthNeeded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [assetFile, setAssetFile] = useState<File | null>(null)
  const [form, setForm] = useState({ type: 'tools', slug: '', title: '', summary: '', content: '', links: '', tags: '', status: 'draft' })

  const adminHeaders = (json = false) => ({ ...(json ? { 'Content-Type': 'application/json' } : {}), ...(adminKey ? { 'X-Admin-Key': adminKey } : {}) })
  const [submittedKey, setSubmittedKey] = useState(adminKey)
  const [revision, setRevision] = useState(0)
  const reloadResources = () => setRevision(value => value + 1)
  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/admin/resources', {
      headers: submittedKey ? { 'X-Admin-Key': submittedKey } : {}, signal: controller.signal,
    }).then(async response => {
      if (controller.signal.aborted) return
      if (response.status === 401) { setAuthNeeded(true); return }
      if (!response.ok) throw new Error('API unavailable')
      const { data } = await response.json() as { data: Resource[] }
      if (controller.signal.aborted) return
      setAuthNeeded(false)
      setSaved(data)
    }).catch(() => {
      if (!controller.signal.aborted) setMessage('后台 API 暂时不可用，请检查 Wrangler 开发服务器。')
    })
    return () => controller.abort()
  }, [submittedKey, revision])

  const saveAdminKey = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    window.localStorage.setItem('klasma_admin_key', adminKey)
    setSubmittedKey(adminKey)
    reloadResources()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('正在保存…')
    const response = await fetch(editingId ? `/api/admin/resources/${editingId}` : '/api/admin/resources', {
      method: editingId ? 'PUT' : 'POST',
      headers: adminHeaders(true),
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
    reloadResources()
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
    const response = await fetch(`/api/admin/resources/${resource.id}`, { method: 'DELETE', headers: adminHeaders() })
    setMessage(response.ok ? '资源已删除。' : '删除失败，请检查 Worker 日志。')
    if (response.ok) reloadResources()
  }

  const uploadAsset = async () => {
    if (!editingId || !assetFile) return
    const body = new FormData()
    body.set('resourceId', editingId)
    body.set('kind', 'attachment')
    body.set('file', assetFile)
    const response = await fetch('/api/admin/assets', { method: 'POST', headers: adminHeaders(), body })
    setMessage(response.ok ? '附件已上传到 R2。' : '附件上传失败，请检查 Worker 日志。')
    if (response.ok) { setAssetFile(null); reloadResources() }
  }

  const deleteAsset = async (assetId: string) => {
    const response = await fetch(`/api/admin/assets/${assetId}`, { method: 'DELETE', headers: adminHeaders() })
    setMessage(response.ok ? '附件已删除。' : '附件删除失败。')
    if (response.ok) reloadResources()
  }

  if (authNeeded) return <main className="admin-shell"><header className="admin-header"><button className="text-button" type="button" onClick={onBack}>← 返回前台</button><span className="admin-label">Klasma / Admin</span></header><section className="auth-panel"><p className="kicker">Private route</p><h1>输入管理密钥。</h1><form onSubmit={saveAdminKey}><input className="auth-input" type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} placeholder="ADMIN_KEY" autoFocus /><button className="save-button" type="submit">进入管理页 ↗</button></form></section></main>

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
            <label>类型<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="tools">Tools</option>{editingId && form.type === 'projects' && <option value="projects">Projects · 历史记录</option>}<option value="library">Library</option></select></label>
            <label>Slug<input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="my-useful-tool" /></label>
            <label>标题<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="资源名称" /></label>
            <label>一句话说明<textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="为什么值得保留" rows={3} /></label>
            <label>详细内容<textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="可以先写 Markdown，后续接入渲染" rows={6} /></label>
            <label>外部链接<input value={form.links} onChange={(event) => setForm({ ...form, links: event.target.value })} placeholder="多个链接用逗号分隔" /></label>
            <label>标签<input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="minecraft, sfm, automation" /></label>
            <label>状态<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">草稿</option><option value="published">发布</option></select></label>
            <div className="form-actions"><button className="save-button" type="submit">{editingId ? '更新资源' : '保存资源'} <span>↗</span></button>{editingId && <button className="text-button" type="button" onClick={() => { setEditingId(null); setForm({ type: 'tools', slug: '', title: '', summary: '', content: '', links: '', tags: '', status: 'draft' }) }}>取消编辑</button>}</div>
            {editingId && <div className="asset-upload"><label>上传附件<input type="file" onChange={(event) => setAssetFile(event.target.files?.[0] ?? null)} /></label><button className="text-button" type="button" disabled={!assetFile} onClick={() => void uploadAsset()}>上传到 R2 ↗</button></div>}
            {message && <p className="form-message" role="status">{message}</p>}
          </form>
        </section>
        <aside className="saved-panel">
          <p className="kicker">Current archive</p>
          <h2>已录入的资源</h2>
          {saved.length === 0 ? <p className="empty-state">还没有资源，先保存第一条。</p> : <ul>{saved.map((resource) => <li key={resource.id}><span>{resource.type} · {resource.status}</span><strong>{resource.title}</strong><small>{resource.summary || '没有摘要'}{resource.assets?.length ? ` · ${resource.assets.length} 个附件` : ''}</small>{editingId === resource.id && resource.assets?.map((asset) => <div className="asset-item" key={asset.id}><span>{asset.filename}</span><button type="button" onClick={() => void deleteAsset(asset.id)}>删除附件</button></div>)}<div className="resource-actions"><button type="button" onClick={() => editResource(resource)}>编辑</button><button type="button" onClick={() => void deleteResource(resource)}>删除</button></div></li>)}</ul>}
        </aside>
      </div>
    </main>
  )
}
