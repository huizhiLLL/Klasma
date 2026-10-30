import { Hono, type Context } from 'hono'
import { setCookie } from 'hono/cookie'
import { bodyLimit } from 'hono/body-limit'
import { and, desc, eq, like, or, sql, inArray } from 'drizzle-orm'
import type { Bindings } from './types'
import { createDb } from './db/client'
import { resourceAssets, resourceLinks, resourceTags, resources, tags } from './db/schema'
import { createSession, matchesKey, SESSION_COOKIE, SESSION_SECONDS, validSession } from './auth'
import { categories, publicationErrors, safeUrl, type Resource, type ResourceAsset, type ResourceInput } from '../shared/resource'

const app = new Hono<{ Bindings:Bindings }>()
const parseObject = (value:string):Record<string, unknown> => { try { const data = JSON.parse(value); return data && typeof data === 'object' && !Array.isArray(data) ? data : {} } catch { return {} } }
const authorized = (c:{ req:{ raw:Request }; env:Bindings }) => validSession(getCookieFromRequest(c.req.raw),c.env.ADMIN_KEY)
function getCookieFromRequest(request:Request) { return request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1) }
app.onError((error,c) => {
  console.error(error)
  return c.json({ error:'服务暂时不可用，请稍后重试。' },500)
})
app.use('/api/*',bodyLimit({ maxSize:26 * 1024 * 1024,onError:c => c.json({ error:'请求超过 26 MB 上限。' },413) }))
app.use('/api/*',async (c,next) => {
  c.header('Cache-Control','no-store')
  c.header('X-Content-Type-Options','nosniff')
  if (!['GET','HEAD','OPTIONS'].includes(c.req.method)) {
    const origin = c.req.header('Origin')
    if (c.req.header('Sec-Fetch-Site') === 'cross-site' || (origin && origin !== new URL(c.req.url).origin)) return c.json({ error:'不允许跨站操作。' },403)
    if (c.req.path !== '/api/admin/assets' && !c.req.header('Content-Type')?.includes('application/json')) return c.json({ error:'请使用 JSON 请求。' },415)
  }
  await next()
})
app.get('/api/health',c => c.json({ ok:true,service:'klasma-api' }))
app.get('/api/admin/session',async c => c.json({ authenticated:await authorized(c) }))
app.post('/api/admin/session',async c => {
  if (!c.env.ADMIN_KEY) return c.json({ error:'尚未配置管理密钥，请设置 ADMIN_KEY。' },503)
  const body = await c.req.json().catch(() => null)
  if (!body || typeof body.key !== 'string' || body.key.length > 1024 || !await matchesKey(body.key,c.env)) return c.json({ error:'管理密钥不正确。' },401)
  setCookie(c,SESSION_COOKIE,await createSession(c.env.ADMIN_KEY),{ httpOnly:true,secure:new URL(c.req.url).protocol === 'https:',sameSite:'Strict',path:'/api',maxAge:SESSION_SECONDS })
  return c.json({ authenticated:true,expiresAt:new Date(Date.now() + SESSION_SECONDS * 1000).toISOString() })
})
app.delete('/api/admin/session',c => {
  setCookie(c,SESSION_COOKIE,'',{ httpOnly:true,secure:new URL(c.req.url).protocol === 'https:',sameSite:'Strict',path:'/api',maxAge:0 })
  return c.body(null,204)
})
app.use('/api/admin/*',async (c,next) => {
  if (!await authorized(c)) return c.json({ error:'登录已过期，请重新输入管理密钥。' },401)
  await next()
})
async function hydrate(db:ReturnType<typeof createDb>, rows:typeof resources.$inferSelect[]):Promise<Resource[]> {
  if (!rows.length) return []
  if (rows.length > 80) {
    const result:Resource[] = []
    for (let offset = 0; offset < rows.length; offset += 80) result.push(...await hydrate(db,rows.slice(offset,offset + 80)))
    return result
  }
  const ids = rows.map(row => row.id)
  const [links,assets,tagRows] = await Promise.all([
    db.select().from(resourceLinks).where(inArray(resourceLinks.resourceId,ids)),
    db.select().from(resourceAssets).where(inArray(resourceAssets.resourceId,ids)),
    db.select({ resourceId:resourceTags.resourceId,slug:tags.slug,label:tags.label }).from(resourceTags).innerJoin(tags,eq(tags.id,resourceTags.tagId)).where(inArray(resourceTags.resourceId,ids)),
  ])
  return rows.map(row => ({ ...row,createdAt:row.createdAt.toISOString(),updatedAt:row.updatedAt.toISOString(),metadata:parseObject(row.metadata),links:links.filter(link => link.resourceId === row.id),tags:tagRows.filter(tag => tag.resourceId === row.id).map(({ slug,label }) => ({ slug,label })),assets:assets.filter(asset => asset.resourceId === row.id).map(asset => ({ ...asset,kind:asset.kind as ResourceAsset['kind'],metadata:parseObject(asset.metadata),url:`/api/assets/${asset.id}` })) }))
}

app.get('/api/resources',async c => {
  const db = createDb(c.env.DB)
  const type = c.req.query('type')
  if (type && !['tools','library'].includes(type)) return c.json({ error:'资源类型无效。' },400)
  const query = c.req.query('q')?.trim()
  const filters = [eq(resources.status,'published'),inArray(resources.type,['tools','library'])]
  if (type) filters.push(eq(resources.type,type as 'tools' | 'library'))
  if (query) filters.push(or(like(resources.title,`%${query}%`),like(resources.summary,`%${query}%`))!)
  return c.json({ data:await hydrate(db,await db.select().from(resources).where(and(...filters)).orderBy(desc(resources.updatedAt))) })
})
app.get('/api/resources/:slug',async c => {
  const db = createDb(c.env.DB)
  const rows = await db.select().from(resources).where(and(eq(resources.slug,c.req.param('slug')),eq(resources.status,'published'),inArray(resources.type,['tools','library']))).limit(1)
  if (!rows.length) return c.json({ error:'没有找到这条资源。' },404)
  return c.json({ data:(await hydrate(db,rows))[0] })
})
app.get('/api/admin/resources',async c => {
  const db = createDb(c.env.DB)
  return c.json({ data:await hydrate(db,await db.select().from(resources).orderBy(desc(resources.updatedAt))) })
})
function validate(body:unknown):ResourceInput | string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return '资源内容无效。'
  const data = body as ResourceInput
  if (!['tools','library','projects'].includes(data.type) || !['draft','published'].includes(data.status)) return '类型或状态无效。'
  if (typeof data.title !== 'string' || !data.title.trim() || data.title.length > 200) return '名称需为 1–200 个字符。'
  if (typeof data.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug) || data.slug.length > 120) return 'Slug 请使用小写字母、数字和短横线，最多 120 个字符。'
  if (typeof data.summary !== 'string' || data.summary.length > 2000 || typeof data.content !== 'string' || data.content.length > 200000) return '说明或正文长度超出限制。'
  if (!data.metadata || typeof data.metadata !== 'object' || Array.isArray(data.metadata)) return '专属字段无效。'
  const strings = ['platform','category','assetKind','version','footprint','notes','code','language'] as const
  for (const key of strings) if (data.metadata[key] !== undefined && (typeof data.metadata[key] !== 'string' || data.metadata[key]!.length > (key === 'code' || key === 'notes' ? 200000 : 500))) return '专属字段格式或长度无效。'
  if (data.metadata.category && !categories.some(item => item.slug === data.metadata.category)) return '分类无效。'
  if (data.metadata.assetKind && !['code','line','tower'].includes(data.metadata.assetKind)) return '资产类型无效。'
  if (data.metadata.order !== undefined && (!Number.isSafeInteger(data.metadata.order) || Math.abs(data.metadata.order) > 100000)) return '展示顺序需为有效整数。'
  if (!Array.isArray(data.links) || data.links.length > 30 || data.links.some(link => !link || typeof link.url !== 'string' || link.url.length > 4000 || !safeUrl(link.url) || !['website','github','download','article','other'].includes(link.kind) || typeof link.label !== 'string' || link.label.length > 200)) return '链接需包含有效的 http 或 https 地址。'
  if (!Array.isArray(data.tagSlugs) || data.tagSlugs.length > 50 || data.tagSlugs.some(tag => typeof tag !== 'string' || !tag.trim() || tag.length > 80)) return '标签格式无效。'
  return { ...data,title:data.title.trim(),tagSlugs:[...new Set(data.tagSlugs.map(tag => tag.trim().toLowerCase()))] }
}
async function save(c:Context<{ Bindings:Bindings }>, id?:string) {
  const input = validate(await c.req.json().catch(() => null))
  if (typeof input === 'string') return c.json({ error:input },400)
  const db = createDb(c.env.DB)
  const current = id ? (await db.select().from(resources).where(eq(resources.id,id)).limit(1))[0] : undefined
  if (id && !current) return c.json({ error:'没有找到这条资源。' },404)
  if ((!current && input.type === 'projects') || (current && input.type !== current.type)) return c.json({ error:'资源创建后不能更改集合。作品请通过代码维护。' },400)
  const duplicate = (await db.select({ id:resources.id }).from(resources).where(eq(resources.slug,input.slug)).limit(1))[0]
  if (duplicate && duplicate.id !== id) return c.json({ error:'这个 Slug 已被使用，请换一个。' },409)
  const assets = current ? (await hydrate(db,[current]))[0].assets : []
  if (input.status === 'published') {
    const errors = publicationErrors(input,assets)
    if (errors.length) return c.json({ error:errors.join(' ') },400)
  }
  const resourceId = id ?? crypto.randomUUID()
  const now = new Date()
  const fields = { type:input.type,slug:input.slug,title:input.title,summary:input.summary,content:input.content,metadata:JSON.stringify(input.metadata),status:input.status,updatedAt:now }
  // Recheck media in the write transaction: another tab may delete it after validation.
  const mediaGuard = input.status !== 'published' ? sql`1 = 1` : input.type === 'tools'
    ? sql`EXISTS (SELECT 1 FROM resource_assets WHERE resource_id = ${resourceId} AND kind = 'icon')`
    : input.type === 'library' && !input.content.trim() && !input.metadata.code?.trim() && !input.links.length
      ? sql`EXISTS (SELECT 1 FROM resource_assets WHERE resource_id = ${resourceId})` : sql`1 = 1`
  const first = current ? db.update(resources).set(fields).where(and(eq(resources.id,resourceId),mediaGuard)).returning({ id:resources.id }) : db.insert(resources).values({ ...fields,id:resourceId,createdAt:now,featured:false }).returning({ id:resources.id })
  const relations = [db.delete(resourceLinks).where(and(eq(resourceLinks.resourceId,resourceId),mediaGuard)),db.delete(resourceTags).where(and(eq(resourceTags.resourceId,resourceId),mediaGuard))]
  const linkInserts = input.links.map(link => db.insert(resourceLinks).select(db.select({ id:sql<string>`${crypto.randomUUID()}`.as('id'),resourceId:resources.id,kind:sql<string>`${link.kind}`.as('kind'),url:sql<string>`${link.url}`.as('url'),label:sql<string>`${link.label}`.as('label') }).from(resources).where(and(eq(resources.id,resourceId),mediaGuard))))
  const tagQueries = input.tagSlugs.flatMap(slug => [
    db.insert(tags).select(db.select({ id:sql<string>`${crypto.randomUUID()}`.as('id'),slug:sql<string>`${slug}`.as('slug'),label:sql<string>`${slug}`.as('label') }).from(resources).where(and(eq(resources.id,resourceId),mediaGuard))).onConflictDoNothing({ target:tags.slug }),
    db.insert(resourceTags).select(db.select({ resourceId:sql<string>`${resourceId}`.as('resource_id'),tagId:tags.id }).from(tags).where(and(eq(tags.slug,slug),mediaGuard))),
  ])
  const result = await db.batch([first,...relations,...linkInserts,...tagQueries])
  if (!result[0].length) return c.json({ error:'素材已发生变化，请检查后重新发布。' },409)
  const saved = await db.select().from(resources).where(eq(resources.id,resourceId)).limit(1)
  return c.json({ data:(await hydrate(db,saved))[0] },current ? 200 : 201)
}
app.post('/api/admin/resources',c => save(c))
app.put('/api/admin/resources/:id',c => save(c,c.req.param('id')))
app.delete('/api/admin/resources/:id',async c => {
  const db = createDb(c.env.DB)
  const id = c.req.param('id')
  const row = (await db.select().from(resources).where(eq(resources.id,id)).limit(1))[0]
  if (!row) return c.json({ error:'没有找到这条资源。' },404)
  const assets = await db.select().from(resourceAssets).where(eq(resourceAssets.resourceId,id))
  // Keep metadata until object deletion succeeds so failed cleanup can be retried.
  for (const asset of assets) if (asset.storageType === 'r2') await c.env.BUCKET.delete(asset.location)
  await db.batch([
    db.delete(resourceTags).where(eq(resourceTags.resourceId,id)),db.delete(resourceLinks).where(eq(resourceLinks.resourceId,id)),
    db.delete(resourceAssets).where(eq(resourceAssets.resourceId,id)),db.delete(resources).where(eq(resources.id,id)),
  ])
  return c.body(null,204)
})
app.get('/api/assets/:id',async c => {
  const db = createDb(c.env.DB)
  const row = (await db.select({ asset:resourceAssets,status:resources.status }).from(resourceAssets).innerJoin(resources,eq(resources.id,resourceAssets.resourceId)).where(eq(resourceAssets.id,c.req.param('id'))).limit(1))[0]
  if (!row || (row.status !== 'published' && !await authorized(c))) return c.notFound()
  if (row.asset.storageType === 'external') return safeUrl(row.asset.location) ? c.redirect(row.asset.location) : c.notFound()
  const object = await c.env.BUCKET.get(row.asset.location)
  if (!object) return c.notFound()
  const headers = new Headers({ 'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff' })
  object.writeHttpMetadata(headers as unknown as import('@cloudflare/workers-types').Headers)
  // Only raster images are rendered inline; HTML/SVG uploads cannot execute on the application origin.
  const inline = ['image/png','image/jpeg','image/webp','image/gif','image/avif'].includes(row.asset.mimeType)
  headers.set('Content-Type',inline ? row.asset.mimeType : 'application/octet-stream')
  headers.set('Content-Disposition',`${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(row.asset.filename)}`)
  return new Response(object.body as unknown as BodyInit,{ headers })
})
app.post('/api/admin/assets',async c => {
  const form = await c.req.parseBody()
  const resourceId = typeof form.resourceId === 'string' ? form.resourceId : ''
  const kind = typeof form.kind === 'string' ? form.kind : 'attachment'
  const file = form.file
  if (!resourceId || !(file instanceof File) || !['icon','cover','screenshot','attachment'].includes(kind)) return c.json({ error:'请选择资源、文件和素材用途。' },400)
  if (file.size > 25 * 1024 * 1024 || file.size === 0) return c.json({ error:'文件需大于 0 且不超过 25 MB。' },400)
  if (kind !== 'attachment' && !['image/png','image/jpeg','image/webp','image/gif','image/avif'].includes(file.type)) return c.json({ error:'图片请使用 PNG、JPEG、WebP、GIF 或 AVIF。' },400)
  const metadata = parseObject(typeof form.metadata === 'string' ? form.metadata : '{}')
  if ((metadata.label !== undefined && (typeof metadata.label !== 'string' || metadata.label.length > 200)) || ['width','height'].some(key => metadata[key] !== undefined && (typeof metadata[key] !== 'number' || !Number.isFinite(metadata[key]) || Number(metadata[key]) <= 0 || Number(metadata[key]) > 50000)) || (metadata.order !== undefined && (!Number.isSafeInteger(metadata.order) || Math.abs(Number(metadata.order)) > 100000))) return c.json({ error:'素材说明、尺寸或顺序无效。' },400)
  const db = createDb(c.env.DB)
  if (!(await db.select({ id:resources.id }).from(resources).where(eq(resources.id,resourceId)).limit(1)).length) return c.json({ error:'资源尚未保存。' },404)
  const id = crypto.randomUUID()
  const location = `resources/${resourceId}/${id}`
  await c.env.BUCKET.put(location,await file.arrayBuffer(),{ httpMetadata:{ contentType:file.type || 'application/octet-stream' } })
  try {
    await db.insert(resourceAssets).values({ id,resourceId,kind,filename:file.name,storageType:'r2',location,mimeType:file.type || 'application/octet-stream',size:file.size,metadata:JSON.stringify(metadata),createdAt:new Date() })
  } catch (error) { await c.env.BUCKET.delete(location); throw error }
  const row = (await db.select().from(resources).where(eq(resources.id,resourceId)).limit(1))[0]
  return c.json({ data:(await hydrate(db,[row]))[0] },201)
})
app.post('/api/admin/assets/external',async c => {
  const body = await c.req.json().catch(() => null)
  if (!body || typeof body.resourceId !== 'string' || !['icon','cover','screenshot','attachment'].includes(body.kind) || typeof body.url !== 'string' || body.url.length > 4000 || !safeUrl(body.url) || typeof body.label !== 'string' || body.label.length > 200) return c.json({ error:'请填写有效的素材地址与用途。' },400)
  const metadata = body.metadata
  if (!metadata || typeof metadata !== 'object' || !Number.isSafeInteger(metadata.order) || Math.abs(metadata.order) > 100000 || (body.kind !== 'attachment' && ['width','height'].some(key => !Number.isFinite(metadata[key]) || metadata[key] <= 0 || metadata[key] > 50000))) return c.json({ error:'请填写有效的图片尺寸与顺序。' },400)
  const db = createDb(c.env.DB)
  const row = (await db.select().from(resources).where(eq(resources.id,body.resourceId)).limit(1))[0]
  if (!row) return c.json({ error:'资源尚未保存。' },404)
  await db.insert(resourceAssets).values({ id:crypto.randomUUID(),resourceId:row.id,kind:body.kind,filename:body.label || new URL(body.url).pathname.split('/').pop() || '外部素材',storageType:'external',location:body.url,mimeType:body.kind === 'attachment' ? 'application/octet-stream' : 'image/*',size:null,metadata:JSON.stringify({ label:body.label,width:metadata.width,height:metadata.height,order:metadata.order }),createdAt:new Date() })
  return c.json({ data:(await hydrate(db,[row]))[0] },201)
})
app.put('/api/admin/assets/:id',async c => {
  const body = await c.req.json().catch(() => null)
  if (!body || typeof body.label !== 'string' || body.label.length > 200 || !Number.isSafeInteger(body.order) || Math.abs(body.order) > 100000) return c.json({ error:'素材说明或顺序无效。' },400)
  const db = createDb(c.env.DB)
  const asset = (await db.select().from(resourceAssets).where(eq(resourceAssets.id,c.req.param('id'))).limit(1))[0]
  if (!asset) return c.notFound()
  await db.update(resourceAssets).set({ metadata:JSON.stringify({ ...parseObject(asset.metadata),label:body.label,order:body.order }) }).where(eq(resourceAssets.id,asset.id))
  return c.json({ ok:true })
})
app.delete('/api/admin/assets/:id',async c => {
  const db = createDb(c.env.DB)
  const asset = (await db.select().from(resourceAssets).where(eq(resourceAssets.id,c.req.param('id'))).limit(1))[0]
  if (!asset) return c.notFound()
  const row = (await db.select().from(resources).where(eq(resources.id,asset.resourceId)).limit(1))[0]
  if (row.status === 'published') {
    const resource = (await hydrate(db,[row]))[0]
    if (publicationErrors({ ...resource,tagSlugs:resource.tags.map(tag => tag.slug) },resource.assets.filter(item => item.id !== asset.id)).length) return c.json({ error:'删除后必要信息不完整，请先取消发布。' },409)
  }
  const removable = sql`EXISTS (SELECT 1 FROM resources r WHERE r.id = ${asset.resourceId} AND (
    r.status = 'draft' OR r.type = 'projects'
    OR (r.type = 'tools' AND (${asset.kind} <> 'icon' OR EXISTS (SELECT 1 FROM resource_assets a WHERE a.resource_id = r.id AND a.kind = 'icon' AND a.id <> ${asset.id})))
    OR (r.type = 'library' AND (TRIM(r.content) <> '' OR TRIM(COALESCE(json_extract(r.metadata, '$.code'), '')) <> '' OR EXISTS (SELECT 1 FROM resource_links l WHERE l.resource_id = r.id) OR EXISTS (SELECT 1 FROM resource_assets a WHERE a.resource_id = r.id AND a.id <> ${asset.id})))
  ))`
  const deleted = await db.delete(resourceAssets).where(and(eq(resourceAssets.id,asset.id),removable)).returning({ id:resourceAssets.id })
  if (!deleted.length) return c.json({ error:'内容状态已变化，请先取消发布再删除。' },409)
  try { if (asset.storageType === 'r2') await c.env.BUCKET.delete(asset.location) }
  catch (error) { await db.insert(resourceAssets).values(asset); throw error }
  return c.body(null,204)
})
app.all('/api/*',c => c.json({ error:'接口不存在。' },404))
app.all('*',c => c.env.ASSETS.fetch(c.req.raw as never) as never)
export default app
