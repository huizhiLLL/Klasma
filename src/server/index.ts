import { Hono } from 'hono'
import { and, asc, desc, eq, like, or } from 'drizzle-orm'

import type { Bindings } from './types'
import { createDb } from './db/client'
import { resourceAssets, resourceLinks, resourceTags, resources, tags } from './db/schema'

const app = new Hono<{ Bindings: Bindings }>()

const requireAdmin = (c: { env: Bindings; req: { header: (name: string) => string | undefined } }) => {
  if (c.env.APP_ENV === 'local') return true
  const adminKey = c.env.ADMIN_KEY
  return Boolean(c.req.header('Cf-Access-Authenticated-User-Email')) || Boolean(adminKey) && c.req.header('X-Admin-Key') === adminKey
}

app.get('/api/health', (c) => c.json({ ok: true, service: 'klasma-api' }))

app.get('/api/resources', async (c) => {
  const db = createDb(c.env.DB)
  const type = c.req.query('type')
  const query = c.req.query('q')?.trim()
  const sort = c.req.query('sort')
  const filters = [eq(resources.status, 'published')]
  if (type) filters.push(eq(resources.type, type as 'tools' | 'projects' | 'library'))
  if (query) filters.push(or(like(resources.title, `%${query}%`), like(resources.summary, `%${query}%`))!)
  const order = sort === 'title' ? asc(resources.title) : desc(resources.updatedAt)
  const rows = await db.select().from(resources).where(and(...filters)).orderBy(order)

  return c.json({ data: rows })
})

app.get('/api/resources/:slug', async (c) => {
  const db = createDb(c.env.DB)
  const rows = await db.select().from(resources).where(eq(resources.slug, c.req.param('slug'))).limit(1)
  const resource = rows[0]

  if (!resource || resource.status !== 'published') return c.json({ error: 'Resource not found' }, 404)
  const [links, assets, resourceTagRows] = await Promise.all([
    db.select().from(resourceLinks).where(eq(resourceLinks.resourceId, resource.id)),
    db.select().from(resourceAssets).where(eq(resourceAssets.resourceId, resource.id)),
    db.select({ tag: tags }).from(resourceTags).innerJoin(tags, eq(resourceTags.tagId, tags.id)).where(eq(resourceTags.resourceId, resource.id)),
  ])
  return c.json({ data: { ...resource, links, assets, tags: resourceTagRows.map(({ tag }) => tag) } })
})

app.get('/api/assets/:id', async (c) => {
  const db = createDb(c.env.DB)
  const rows = await db.select().from(resourceAssets).where(eq(resourceAssets.id, c.req.param('id'))).limit(1)
  const asset = rows[0]
  if (!asset) return c.notFound()
  if (asset.storageType === 'external') return c.redirect(asset.location)
  const object = await c.env.ASSETS.get(asset.location)
  if (!object) return c.notFound()
  const headers = new Headers() as unknown as Headers
  object.writeHttpMetadata(headers as unknown as import('@cloudflare/workers-types').Headers)
  headers.set('etag', object.httpEtag)
  headers.set('cache-control', 'public, max-age=31536000, immutable')
  return new Response(object.body as unknown as BodyInit, { headers: headers as unknown as HeadersInit })
})

app.get('/api/admin/resources', async (c) => {
  if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const db = createDb(c.env.DB)
  const rows = await db.select().from(resources).orderBy(desc(resources.updatedAt))
  const data = await Promise.all(rows.map(async (resource) => {
    const [links, assets, resourceTagRows] = await Promise.all([
      db.select().from(resourceLinks).where(eq(resourceLinks.resourceId, resource.id)),
      db.select().from(resourceAssets).where(eq(resourceAssets.resourceId, resource.id)),
      db.select({ tag: tags }).from(resourceTags).innerJoin(tags, eq(resourceTags.tagId, tags.id)).where(eq(resourceTags.resourceId, resource.id)),
    ])
    return { ...resource, links, assets, tags: resourceTagRows.map(({ tag }) => tag) }
  }))
  return c.json({ data })
})

type ResourceInput = {
  type?: 'tools' | 'projects' | 'library'
  slug?: string
  title?: string
  summary?: string
  content?: string
  metadata?: Record<string, unknown>
  status?: 'draft' | 'published'
  links?: Array<{ kind?: string; url?: string; label?: string }>
  tagSlugs?: string[]
}

const syncResourceRelations = async (database: ReturnType<typeof createDb>, resourceId: string, input: ResourceInput) => {
  if (input.links) {
    await database.delete(resourceLinks).where(eq(resourceLinks.resourceId, resourceId))
    const validLinks = input.links.filter((link) => link.kind && link.url)
    if (validLinks.length) await database.insert(resourceLinks).values(validLinks.map((link) => ({ id: crypto.randomUUID(), resourceId, kind: link.kind!, url: link.url!, label: link.label ?? '' })))
  }
  if (input.tagSlugs) {
    await database.delete(resourceTags).where(eq(resourceTags.resourceId, resourceId))
    const normalized = [...new Set(input.tagSlugs.map((slug) => slug.trim().toLowerCase()).filter(Boolean))]
    for (const slug of normalized) {
      const id = crypto.randomUUID()
      await database.insert(tags).values({ id, slug, label: slug }).onConflictDoNothing({ target: tags.slug })
      const tag = await database.select().from(tags).where(eq(tags.slug, slug)).limit(1)
      if (tag[0]) await database.insert(resourceTags).values({ resourceId, tagId: tag[0].id }).onConflictDoNothing()
    }
  }
}

app.post('/api/admin/resources', async (c) => {
  if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json<ResourceInput>()

  if (!body.type || !body.slug || !body.title) {
    return c.json({ error: 'type, slug and title are required' }, 400)
  }

  const now = new Date()
  const resource = {
    id: crypto.randomUUID(),
    type: body.type,
    slug: body.slug,
    title: body.title,
    summary: body.summary ?? '',
    content: body.content ?? '',
    metadata: JSON.stringify(body.metadata ?? {}),
    status: body.status ?? 'draft',
    featured: false,
    createdAt: now,
    updatedAt: now,
  } as const

  const db = createDb(c.env.DB)
  await db.insert(resources).values(resource)
  await syncResourceRelations(db, resource.id, body)
  return c.json({ data: resource }, 201)
})

app.put('/api/admin/resources/:id', async (c) => {
  if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const body = await c.req.json<ResourceInput>()
  const db = createDb(c.env.DB)
  const current = await db.select().from(resources).where(eq(resources.id, c.req.param('id'))).limit(1)
  if (!current[0]) return c.json({ error: 'Resource not found' }, 404)

  const updated = {
    type: body.type ?? current[0].type,
    slug: body.slug ?? current[0].slug,
    title: body.title ?? current[0].title,
    summary: body.summary ?? current[0].summary,
    content: body.content ?? current[0].content,
    metadata: body.metadata ? JSON.stringify(body.metadata) : current[0].metadata,
    status: body.status ?? current[0].status,
    updatedAt: new Date(),
  }
  await db.update(resources).set(updated).where(eq(resources.id, current[0].id))
  await syncResourceRelations(db, current[0].id, body)
  return c.json({ data: { ...current[0], ...updated } })
})

app.delete('/api/admin/resources/:id', async (c) => {
  if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const db = createDb(c.env.DB)
  const resourceId = c.req.param('id')
  await db.delete(resourceTags).where(eq(resourceTags.resourceId, resourceId))
  await db.delete(resourceLinks).where(eq(resourceLinks.resourceId, resourceId))
  await db.delete(resourceAssets).where(eq(resourceAssets.resourceId, resourceId))
  const deleted = await db.delete(resources).where(eq(resources.id, resourceId)).returning({ id: resources.id })
  if (!deleted[0]) return c.json({ error: 'Resource not found' }, 404)
  return c.body(null, 204)
})

app.post('/api/admin/assets', async (c) => {
  if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const form = await c.req.parseBody()
  const resourceId = typeof form.resourceId === 'string' ? form.resourceId : ''
  const kind = typeof form.kind === 'string' ? form.kind : 'file'
  const file = form.file
  if (!resourceId || !(file instanceof File)) return c.json({ error: 'resourceId and file are required' }, 400)

  const db = createDb(c.env.DB)
  const resource = await db.select({ id: resources.id }).from(resources).where(eq(resources.id, resourceId)).limit(1)
  if (!resource[0]) return c.json({ error: 'Resource not found' }, 404)

  const assetId = crypto.randomUUID()
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `resources/${resourceId}/${assetId}-${safeFilename}`
  await c.env.ASSETS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || 'application/octet-stream' } })
  const asset = { id: assetId, resourceId, kind, filename: file.name, storageType: 'r2' as const, location: key, mimeType: file.type || 'application/octet-stream', size: file.size, metadata: '{}', createdAt: new Date() }
  await db.insert(resourceAssets).values(asset)
  return c.json({ data: { ...asset, url: `/api/assets/${asset.id}` } }, 201)
})

app.delete('/api/admin/assets/:id', async (c) => {
  if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const db = createDb(c.env.DB)
  const asset = await db.select().from(resourceAssets).where(eq(resourceAssets.id, c.req.param('id'))).limit(1)
  if (!asset[0]) return c.json({ error: 'Asset not found' }, 404)
  if (asset[0].storageType === 'r2') await c.env.ASSETS.delete(asset[0].location)
  await db.delete(resourceAssets).where(eq(resourceAssets.id, asset[0].id))
  return c.body(null, 204)
})

export default app
