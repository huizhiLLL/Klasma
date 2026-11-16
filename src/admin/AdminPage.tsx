import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { api, ApiError } from '../shared/api'
import { categories, publicationErrors, resourcePath, type Resource, type ResourceAsset, type ResourceInput } from '../shared/resource'
import { installEditorGuard } from './navigationGuard'
import { Markdown } from '../app/components/Markdown'
import { Dialog } from '../app/components/Dialog'
import { Icon } from '../app/components/Icon'
import { EditorBar } from './components/EditorBar'
import { Segmented } from './components/Segmented'
import { ReadinessCheck } from './components/ReadinessCheck'
import { AssetList } from './components/AssetList'
import { ResourceList } from './components/ResourceList'

type Collection = Resource['type']
type Notice = { kind:'success' | 'error'; text:string }
const label = (type:Collection) => type === 'tools' ? '软件' : type === 'library' ? '工程资产' : '历史作品'
const formatDate = (value:string) => { const date = new Date(value); const now = new Date(); return date.getFullYear() === now.getFullYear() ? (date.getMonth()+1) + '月' + date.getDate() + '日' : date.getFullYear() + '/' + (date.getMonth()+1) + '/' + date.getDate() }
const fresh = (type:Collection):ResourceInput => ({ type,title:'',slug:'',summary:'',content:'',status:'draft',metadata:{ order:0,...(type === 'library' ? { category:'fragments',assetKind:'line' as const } : {}) },links:[],tagSlugs:[] })
const toInput = (resource:Resource):ResourceInput => ({ type:resource.type,title:resource.title,slug:resource.slug,summary:resource.summary,content:resource.content,metadata:resource.metadata,status:resource.status,links:resource.links,tagSlugs:resource.tags.map(tag => tag.slug) })
function slugifyTitle(title:string) {
  const ascii = title.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,96).replace(/-$/,'')
  if (ascii) return ascii
  let hash = 0
  for (const character of title) hash = (hash * 31 + character.codePointAt(0)!) | 0
  return title.trim() ? `item-${Math.abs(hash).toString(36)}` : ''
}
function Field({ title,children,hint }: { title:string;children:ReactNode;hint?:string }) { return <label className="admin-field"><span>{title}</span>{children}{hint && <small>{hint}</small>}</label> }
function Section({ title,children }: { title:string;children:ReactNode }) { return <section className="admin-section"><h2>{title}</h2>{children}</section> }
export function AdminPage({ onBack }: { onBack:()=>void }) {
  const [authenticated,setAuthenticated] = useState<boolean | null>(null)
  const [key,setKey] = useState('')
  const [message,setMessage] = useState('')
  const [busy,setBusy] = useState(false)
  const [items,setItems] = useState<Resource[]>([])
  const [loaded,setLoaded] = useState(false)
  const [collection,setCollection] = useState<Collection>('tools')
  const [query,setQuery] = useState('')
  const [status,setStatus] = useState('all')
  const [category,setCategory] = useState('all')
  const [sort,setSort] = useState('updated')
  const [editing,setEditing] = useState<Resource | Collection | null>(null)
  const fail = useCallback((error:unknown) => { if (error instanceof ApiError && error.status === 401) setAuthenticated(false); setMessage(error instanceof Error ? error.message : '请求失败，请重试。') },[])
  const reload = useCallback(async () => {
    try { const result = await api<{ data:Resource[] }>('/api/admin/resources'); setItems(result.data); setLoaded(true); setMessage('') } catch (error) { fail(error) }
  },[fail])
  useEffect(() => {
    window.localStorage.removeItem('klasma_admin_key')
    let active = true
    api<{ authenticated:boolean }>('/api/admin/session').then(result => { if (active) setAuthenticated(result.authenticated) }).catch(error => { if (active) { setAuthenticated(false); fail(error) } })
    return () => { active = false }
  },[fail])
  useEffect(() => { if (authenticated) { const controller = new AbortController(); void api<{ data:Resource[] }>('/api/admin/resources',{ signal:controller.signal }).then(result => { if (!controller.signal.aborted) { setItems(result.data); setLoaded(true); setMessage('') } }).catch(error => { if (!controller.signal.aborted) fail(error) }); return () => controller.abort() } },[authenticated,fail])
  async function login(event:FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('')
    try { await api('/api/admin/session',{ method:'POST',body:JSON.stringify({ key }) }); setKey(''); setAuthenticated(true) } catch (error) { fail(error) } finally { setBusy(false) }
  }
  async function logout() {
    if (editing && !window.confirm('退出管理页？请先确认编辑内容已保存。')) return
    setBusy(true)
    try { await api('/api/admin/session',{ method:'DELETE',body:'{}' }); setAuthenticated(false); setEditing(null); setItems([]); setLoaded(false) } catch (error) { fail(error) } finally { setBusy(false) }
  }
  const filtered = items.filter(item => item.type === collection && (status === 'all' || item.status === status) && (category === 'all' || item.metadata.category === category) && `${item.title} ${item.slug} ${item.tags.map(tag => tag.label).join(' ')}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => sort === 'name' ? a.title.localeCompare(b.title,'zh-CN') : b.updatedAt.localeCompare(a.updatedAt))
  return <main className="admin-shell">
    <header className="admin-header"><strong>Klasma <span>/ 内容管理</span></strong><nav><button className="admin-btn admin-btn--ghost" type="button" onClick={() => { if (!editing || window.confirm('离开管理页？请先确认编辑内容已保存。')) onBack() }}><Icon name="arrow-up-right" /> 查看前台</button>{authenticated && <button className="admin-btn admin-btn--ghost" type="button" disabled={busy} onClick={() => void logout()}>退出</button>}</nav></header>
    {authenticated === null ? <p role="status">正在检查登录状态…</p> : !authenticated && <section className="admin-login"><p className="admin-eyebrow">Klasma / Admin</p><h1>登录内容管理</h1><p>输入管理密钥。登录后 30 天内无需重复输入。</p><form onSubmit={event => void login(event)}><Field title="管理密钥"><input type="password" autoComplete="current-password" required value={key} onChange={event => setKey(event.target.value)} autoFocus /></Field><button className="admin-btn admin-btn--primary" disabled={busy}>{busy ? '正在登录…' : '登录'}</button></form>{message && <p className="admin-notice notice-error" role="alert">{message}</p>}</section>}
    <div hidden={!authenticated}>
      {editing ? <ResourceEditor active={authenticated === true} key={typeof editing === 'string' ? `new-${editing}` : editing.id} resource={typeof editing === 'string' ? undefined : editing} type={typeof editing === 'string' ? editing : editing.type} tags={[...new Set(items.flatMap(item => item.tags.map(tag => tag.slug)))]} onBack={() => { setEditing(null); void reload() }} onSaved={() => void reload()} onFailure={fail} /> : <>
        <nav className="admin-tabs" aria-label="内容集合">{(['tools','library'] as const).map(type => <button type="button" className="admin-tab" key={type} aria-current={collection === type ? 'page' : undefined} onClick={() => { setCollection(type); setCategory('all') }}><span className="admin-tab-label">{label(type)}</span><span className="admin-tab-count">{items.filter(item => item.type === type).length}</span></button>)}{items.some(item => item.type === 'projects') && <button type="button" className="admin-tab" aria-current={collection === 'projects' ? 'page' : undefined} onClick={() => { setCollection('projects'); setCategory('all') }}><span className="admin-tab-label">历史作品</span><span className="admin-tab-count">{items.filter(item => item.type === 'projects').length}</span></button>}</nav>
        <div className="admin-filters"><label className="admin-search"><Icon name="search" /><input aria-label="搜索内容" type="search" placeholder="搜索名称、Slug、标签" value={query} onChange={event => setQuery(event.target.value)} /></label><select aria-label="发布状态" value={status} onChange={event => setStatus(event.target.value)}><option value="all">状态</option><option value="draft">草稿</option><option value="published">已发布</option></select>{collection === 'library' && <select aria-label="资产分类" value={category} onChange={event => setCategory(event.target.value)}><option value="all">分类</option>{categories.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>}<select aria-label="排序方式" value={sort} onChange={event => setSort(event.target.value)}><option value="updated">排序：最近更新</option><option value="name">排序：名称</option></select>{collection !== 'projects' && <button type="button" className="admin-btn admin-btn--primary admin-new-button" onClick={() => setEditing(collection)}><Icon name="plus" /> 新建</button>}</div>
        {message && <div className="admin-notice notice-error" role="alert">{message} <button className="admin-btn" onClick={() => void reload()}>重试</button></div>}
        {!loaded ? <p role="status">正在读取内容…</p> : filtered.length === 0 ? <div className="admin-list"><div className="admin-empty"><Icon name={query || status !== 'all' || category !== 'all' ? 'search' : 'plus'} /><p>{query || status !== 'all' || category !== 'all' ? '没有匹配内容' : `暂无${label(collection)}`}</p>{query || status !== 'all' || category !== 'all' ? <button className="admin-btn admin-btn--ghost" onClick={() => { setQuery(''); setStatus('all'); setCategory('all') }}>清除筛选</button> : collection !== 'projects' && <button type="button" className="admin-btn admin-btn--primary" onClick={() => setEditing(collection)}><Icon name="plus" /> 新建</button>}</div></div> : <ResourceList items={filtered} collection={collection} categories={categories} formatDate={formatDate} onEdit={setEditing} />}
      </>}
    </div>
  </main>
}
function ResourceEditor({ active,resource,type,tags,onBack,onSaved,onFailure }: { active:boolean;resource?:Resource;type:Collection;tags:string[];onBack:()=>void;onSaved:()=>void;onFailure:(error:unknown)=>void }) {
  const [id,setId] = useState(resource?.id)
  const [form,setForm] = useState<ResourceInput>(() => resource ? toInput(resource) : fresh(type))
  const [assets,setAssets] = useState<ResourceAsset[]>(resource?.assets ?? [])
  const [assetEdits,setAssetEdits] = useState<Record<string,{ label:string;order:number }>>({})
  const [baseline,setBaseline] = useState(() => JSON.stringify(resource ? toInput(resource) : fresh(type)))
  const [busy,setBusy] = useState(false)
  const [notice,setNotice] = useState<Notice | null>(null)
  const [preview,setPreview] = useState(false)
  const [tag,setTag] = useState('')
  const [confirmDelete,setConfirmDelete] = useState<ResourceAsset | 'resource' | null>(null)
  const [retryFile,setRetryFile] = useState<File | null>(null)
  const [uploadKind,setUploadKind] = useState<ResourceAsset['kind']>('screenshot')
  const [external,setExternal] = useState('')
  const [uploadLabel,setUploadLabel] = useState('')
  const [dimensions,setDimensions] = useState({ width:1280,height:800 })
  const fileInput = useRef<HTMLInputElement>(null)
  const dirty = JSON.stringify(form) !== baseline || Object.keys(assetEdits).length > 0
  const update = <K extends keyof ResourceInput>(key:K,value:ResourceInput[K]) => setForm(current => ({ ...current,[key]:value }))
  const meta = <K extends keyof ResourceInput['metadata']>(key:K,value:ResourceInput['metadata'][K]) => setForm(current => ({ ...current,metadata:{ ...current.metadata,[key]:value } }))
  useEffect(() => {
    if (dirty || busy) return installEditorGuard(window,() => !busy && window.confirm('有未保存的修改，确定离开？'))
  },[dirty,busy])
  function leave() { if (!busy && (!dirty || window.confirm('有未保存的修改，确定离开？'))) onBack() }
  async function perform(action:()=>Promise<void>) {
    setBusy(true); setNotice(null)
    try { await action() } catch (error) { setNotice({ kind:'error',text:error instanceof Error ? error.message : '操作失败，请重试。' }); onFailure(error) } finally { setBusy(false) }
  }
  async function persist(status = form.status):Promise<Resource> {
    const data = { ...form,status,slug:form.slug || slugifyTitle(form.title) || `item-${crypto.randomUUID().slice(0,8)}` }
    const result = await api<{ data:Resource }>(id ? `/api/admin/resources/${id}` : '/api/admin/resources',{ method:id ? 'PUT' : 'POST',body:JSON.stringify(data) })
    setId(result.data.id); setForm(toInput(result.data)); setAssets(result.data.assets); setBaseline(JSON.stringify(toInput(result.data))); onSaved()
    return result.data
  }
  function save(status = form.status) { void perform(async () => { for (const [assetId,changes] of Object.entries(assetEdits)) { await saveAssetSettings(assetId,changes) } await persist(status); setNotice({ kind:'success',text:status === 'published' ? '已保存并发布。' : '草稿已保存。' }) }) }
  async function upload(file?:File) {
    setRetryFile(file ?? null)
    await perform(async () => {
      if (!form.title.trim()) throw new Error('请先填写名称，再添加素材。')
      // A new resource is first saved as draft; existing edits retain their explicit save boundary.
      const targetId = id ?? (await persist('draft')).id
      let result:{ data:Resource }
      if (file) {
        let size = dimensions
        if (uploadKind !== 'attachment') {
          const bitmap = await createImageBitmap(file); size = { width:bitmap.width,height:bitmap.height }; bitmap.close()
        }
        const body = new FormData(); body.set('resourceId',targetId); body.set('file',file); body.set('kind',uploadKind); body.set('metadata',JSON.stringify({ ...size,label:uploadLabel || file.name,order:assets.length }))
        result = await api('/api/admin/assets',{ method:'POST',body })
      } else {
        result = await api('/api/admin/assets/external',{ method:'POST',body:JSON.stringify({ resourceId:targetId,kind:uploadKind,url:external,label:uploadLabel,metadata:{ ...dimensions,label:uploadLabel,order:assets.length } }) })
      }
      setAssets(result.data.assets); setRetryFile(null); setExternal(''); setUploadLabel(''); if (fileInput.current) fileInput.current.value = ''; onSaved(); setNotice({ kind:'success',text:'素材已添加。素材调整会立即保存。' })
    })
  }
  async function saveAssetSettings(assetId:string,changes:{ label:string;order:number }) {
    await api(`/api/admin/assets/${assetId}`,{ method:'PUT',body:JSON.stringify(changes) })
    setAssets(current => current.map(item => item.id === assetId ? { ...item,metadata:{ ...item.metadata,...changes } } : item))
    setAssetEdits(current => { const next = { ...current }; delete next[assetId]; return next })
  }
  function changeAsset(asset:ResourceAsset,changes:{ label:string;order:number }) {
    void perform(async () => { await saveAssetSettings(asset.id,changes); setNotice({ kind:'success',text:'素材设置已保存。' }) })
  }
  function draftAsset(asset:ResourceAsset,changes:{ label:string;order:number }) {
    setAssetEdits(current => {
      const next = { ...current }
      if (changes.label === (asset.metadata.label ?? asset.filename) && changes.order === (asset.metadata.order ?? 0)) delete next[asset.id]
      else next[asset.id] = changes
      return next
    })
  }
  const issues = publicationErrors(form,assets)
  const sortedAssets = [...assets].sort((a,b) => (a.metadata.order ?? 0) - (b.metadata.order ?? 0))
  return <>
    <form onSubmit={event => { event.preventDefault(); save() }}><fieldset className="admin-editor-fieldset" disabled={busy || !active}>
      <EditorBar title={form.title || `${id ? '编辑' : '新建'}${label(type)}`} status={busy ? '保存中' : dirty ? '未保存' : id ? '已保存' : '新建'} tone={busy ? 'busy' : dirty ? 'unsaved' : id ? 'saved' : 'new'} busy={busy} onBack={leave} onPublish={() => save('published')} published={form.status === 'published'} />
      {notice && <p className={`admin-notice notice-${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}><Icon name={notice.kind === 'error' ? 'circle-alert' : 'circle-check'} />{notice.text}</p>}
      <div className="admin-editor-grid"><div className="admin-editor-content">
        <section className="admin-main-editor"><div className="admin-basic-grid"><Field title="名称"><input className="admin-title-input" required maxLength={200} value={form.title} placeholder={`输入${label(type)}名称`} onChange={event => { const title = event.target.value; setForm(current => ({ ...current,title,slug:!id && (!current.slug || current.slug === slugifyTitle(current.title)) ? slugifyTitle(title) : current.slug })) }} /></Field><Field title="一句话说明"><textarea rows={2} maxLength={2000} value={form.summary} onChange={event => update('summary',event.target.value)} placeholder="用一句话说明内容价值" /></Field></div>
        <details open={Boolean(retryFile)} className="admin-section admin-disclosure admin-media-disclosure"><summary><h2>媒体</h2><Icon name="chevron-down" /><span>{assets.length ? `${assets.length} 项` : '暂无'}</span></summary><p className="admin-help" aria-label="素材上传说明">上传、说明、排序和删除立即保存。图片支持 PNG、JPEG、WebP、GIF、AVIF，单个最多 25 MB。</p><div className="admin-upload-controls"><Field title="用途"><select value={uploadKind} disabled={busy} onChange={event => setUploadKind(event.target.value as ResourceAsset['kind'])}>{type === 'tools' && <option value="icon">软件图标</option>}<option value="cover">封面</option><option value="screenshot">截图 / 结构图</option><option value="attachment">附件</option></select></Field><Field title="说明"><input value={uploadLabel} onChange={event => setUploadLabel(event.target.value)} maxLength={200} /></Field><Field title="上传"><label className="admin-upload-button"><Icon name="upload" /><span>选择文件</span><input ref={fileInput} type="file" disabled={busy} accept={uploadKind === 'attachment' ? undefined : 'image/png,image/jpeg,image/webp,image/gif,image/avif'} onChange={event => { const file = event.target.files?.[0]; event.currentTarget.value = ''; if (file) void upload(file) }} /></label></Field></div>
          {retryFile && <button type="button" disabled={busy} onClick={() => void upload(retryFile)}>重试上传 {retryFile.name}</button>}<details><summary>使用外部素材地址</summary><Field title="文件地址"><input type="url" value={external} onChange={event => setExternal(event.target.value)} placeholder="https://" /></Field>{uploadKind !== 'attachment' && <div className="admin-inline"><Field title="图片宽度"><input type="number" min={1} max={50000} value={dimensions.width} onChange={event => setDimensions(current => ({ ...current,width:Number(event.target.value) }))} /></Field><Field title="图片高度"><input type="number" min={1} max={50000} value={dimensions.height} onChange={event => setDimensions(current => ({ ...current,height:Number(event.target.value) }))} /></Field></div>}<button type="button" disabled={busy || !external} onClick={() => void upload()}>添加外部素材</button></details>
          <AssetList assets={sortedAssets} edits={assetEdits} busy={busy} onDraft={draftAsset} onSave={(asset, changes) => void changeAsset(asset,changes)} onDelete={asset => setConfirmDelete(asset)} />
        </details>
        <details open className="admin-section admin-section-compact admin-content-disclosure"><summary><div className="admin-section-heading"><h2>正文</h2><Icon name="chevron-down" /><Segmented value={preview ? 'preview' : 'edit'} onChange={value => setPreview(value === 'preview')} /></div></summary><Field title="Markdown 正文"><span className="admin-sr-only">Markdown 正文</span>{preview ? <div className="admin-markdown admin-inline-preview"><Markdown text={form.content || '还没有正文。'} /></div> : <textarea className="admin-content-input" rows={12} value={form.content} onChange={event => update('content',event.target.value)} placeholder={type === 'tools' ? '记录使用体验、喜欢的细节与参考来源' : '说明用途、导入方法和注意事项'} />}</Field>{type === 'library' && <details className="admin-subdisclosure"><summary>工程信息</summary><Field title="代码 / 配置"><textarea className="admin-code-input" rows={8} value={form.metadata.code ?? ''} onChange={event => meta('code',event.target.value)} spellCheck={false} /></Field><div className="admin-inline"><Field title="代码语言"><input value={form.metadata.language ?? ''} onChange={event => meta('language',event.target.value)} placeholder="sfm / toml / json" /></Field><Field title="补充注意事项"><textarea rows={3} value={form.metadata.notes ?? ''} onChange={event => meta('notes',event.target.value)} /></Field></div></details>}</details>
        <details className="admin-section admin-disclosure admin-links-disclosure"><summary><h2>链接</h2><Icon name="chevron-down" /><span>{form.links.length ? `${form.links.length} 个` : '暂无'}</span></summary>{form.links.map((link,index) => <div className="admin-link-row" key={index}><select aria-label={`链接 ${index + 1} 类型`} value={link.kind} onChange={event => update('links',form.links.map((item,i) => i === index ? { ...item,kind:event.target.value } : item))}>{[['website','官网'],['github','仓库'],['download','下载'],['article','文章 / 教程'],['other','其他']].map(([value,name]) => <option key={value} value={value}>{name}</option>)}</select><input aria-label={`链接 ${index + 1} 名称`} placeholder="显示名称" value={link.label} maxLength={200} onChange={event => update('links',form.links.map((item,i) => i === index ? { ...item,label:event.target.value } : item))} /><input aria-label={`链接 ${index + 1} 地址`} type="url" required placeholder="https://" value={link.url} onChange={event => update('links',form.links.map((item,i) => i === index ? { ...item,url:event.target.value } : item))} /><button className="admin-btn admin-btn--icon admin-btn--ghost" aria-label={`移除链接 ${index + 1}`} type="button" onClick={() => update('links',form.links.filter((_,i) => i !== index))}><Icon name="x" /></button></div>)}<button className="admin-btn admin-btn--ghost admin-add-link" type="button" onClick={() => update('links',[...form.links,{ kind:'website',label:'',url:'' }])}><Icon name="plus" /> 添加链接</button></details>
        </section>
      </div><aside className="admin-editor-settings">
        <Section title="发布"><p className={`admin-status status-${form.status}`}>{form.status === 'published' ? '已发布' : '草稿'}</p><Field title="Slug"><input title="小写字母、数字和短横线；留空时自动生成" aria-label="Slug，小写字母、数字和短横线" value={form.slug} maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={event => update('slug',event.target.value)} /></Field>{form.slug && <p className="admin-path">{resourcePath(form)}</p>}{id && form.status === 'published' && <><a href={resourcePath(form)} target="_blank" rel="noreferrer">↗ 前台</a><button type="button" disabled={busy} onClick={() => save('draft')}>取消发布</button></>}</Section>
        <details className="admin-section admin-disclosure"><summary><h2>类型</h2><Icon name="chevron-down" /><span>类型与兼容</span></summary>{type === 'tools' ? <Field title="适用平台"><input value={form.metadata.platform ?? ''} onChange={event => meta('platform',event.target.value)} placeholder="Windows / macOS / Web" /></Field> : <><Field title="所属分类"><select value={form.metadata.category ?? 'fragments'} onChange={event => meta('category',event.target.value)}>{categories.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></Field><Field title="展示类型"><select value={form.metadata.assetKind ?? 'line'} onChange={event => meta('assetKind',event.target.value as 'code' | 'line' | 'tower')}><option value="code">代码 / 配置</option><option value="line">产线 / 蓝图</option><option value="tower">多方块结构</option></select></Field><Field title="结构占地"><input value={form.metadata.footprint ?? ''} onChange={event => meta('footprint',event.target.value)} placeholder="长 × 宽 × 高" /></Field></>}<Field title="版本与兼容说明"><textarea rows={3} value={form.metadata.version ?? ''} onChange={event => meta('version',event.target.value)} placeholder={type === 'tools' ? '可选，记录版本信息' : '游戏版本、Mod 和整合包要求'} /></Field><Field title="顺序"><input title="数字越小越靠前" aria-label="展示顺序，数字越小越靠前" type="number" step={1} min={-100000} max={100000} value={form.metadata.order ?? 0} onChange={event => meta('order',Number(event.target.value))} /></Field></details>
        <details className="admin-section admin-disclosure"><summary><h2>标签</h2><Icon name="chevron-down" /><span>{form.tagSlugs.length ? `${form.tagSlugs.length} 个标签` : '暂无标签'}</span></summary><div className="admin-tags">{form.tagSlugs.map(value => <button key={value} type="button" aria-label={`移除标签 ${value}`} onClick={() => update('tagSlugs',form.tagSlugs.filter(item => item !== value))}>{value} ×</button>)}</div><Field title="添加标签"><input list="admin-known-tags" value={tag} maxLength={80} onChange={event => setTag(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); const value = tag.trim().toLowerCase(); if (value) update('tagSlugs',[...new Set([...form.tagSlugs,value])]); setTag('') } }} placeholder="输入后按 Enter" /></Field><datalist id="admin-known-tags">{tags.map(value => <option key={value} value={value} />)}</datalist></details>
        <ReadinessCheck issues={issues} hasScreenshot={assets.some(asset => asset.kind === 'screenshot')} />
        {id && <button className="admin-btn admin-btn--danger" type="button" disabled={busy} onClick={() => setConfirmDelete('resource')}>删除这条内容</button>}
      </aside></div>
    </fieldset></form>
    {confirmDelete && active && <Dialog title={confirmDelete === 'resource' ? '删除内容' : '删除素材'} onDismiss={() => { if (!busy) setConfirmDelete(null) }}><p>{confirmDelete === 'resource' ? `确定删除“${form.title}”及其上传文件？此操作无法撤销，外部源文件不受影响。` : `确定删除“${confirmDelete.filename}”？上传文件会一并移除，外部源文件不受影响。`}</p><div className="admin-inline"><button disabled={busy} onClick={() => setConfirmDelete(null)}>取消</button><button className="admin-btn admin-btn--danger" disabled={busy} onClick={() => void perform(async () => { if (confirmDelete === 'resource') { await api(`/api/admin/resources/${id}`,{ method:'DELETE',body:'{}' }); onBack() } else { await api(`/api/admin/assets/${confirmDelete.id}`,{ method:'DELETE',body:'{}' }); setAssets(current => current.filter(asset => asset.id !== confirmDelete.id)); setAssetEdits(current => { const next = { ...current }; delete next[confirmDelete.id]; return next }); setNotice({ kind:'success',text:'素材已删除。' }); onSaved() } setConfirmDelete(null) })}>确认删除</button></div></Dialog>}
  </>
}
