import { Hono } from 'hono'
import { desc, eq } from 'drizzle-orm'

import type { Bindings } from './types'
import { createDb } from './db/client'
import { resources } from './db/schema'

const app = new Hono<{ Bindings: Bindings }>()

const requireAdmin = (c: { env: Bindings; req: { header: (name: string) => string | undefined } }) => {
  if (c.env.APP_ENV === 'local') return true
  return Boolean(c.req.header('Cf-Access-Authenticated-User-Email')) || c.req.header('X-Admin-Key') === c.env.ADMIN_KEY
}

app.get('/api/health', (c) => c.json({ ok: true, service: 'klasma-api' }))

app.get('/api/resources', async (c) => {
  const db = createDb(c.env.DB)
  const type = c.req.query('type')
  const rows = type
    ? await db.select().from(resources).where(eq(resources.type, type as 'tools' | 'projects' | 'library')).orderBy(desc(resources.updatedAt))
    : await db.select().from(resources).where(eq(resources.status, 'published')).orderBy(desc(resources.updatedAt))

  return c.json({ data: rows })
})

app.get('/api/resources/:slug', async (c) => {
  const db = createDb(c.env.DB)
  const rows = await db.select().from(resources).where(eq(resources.slug, c.req.param('slug'))).limit(1)
  const resource = rows[0]

  if (!resource || resource.status !== 'published') return c.json({ error: 'Resource not found' }, 404)
  return c.json({ data: resource })
})

app.get('/api/admin/resources', async (c) => {
  if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const db = createDb(c.env.DB)
  const rows = await db.select().from(resources).orderBy(desc(resources.updatedAt))
  return c.json({ data: rows })
})

app.post('/api/admin/resources', async (c) => {
  if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json<{
    type?: 'tools' | 'projects' | 'library'
    slug?: string
    title?: string
    summary?: string
    content?: string
    status?: 'draft' | 'published'
  }>()

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
    metadata: '{}',
    status: body.status ?? 'draft',
    featured: false,
    createdAt: now,
    updatedAt: now,
  } as const

  const db = createDb(c.env.DB)
  await db.insert(resources).values(resource)
  return c.json({ data: resource }, 201)
})

export default app
