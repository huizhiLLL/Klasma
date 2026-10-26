import { Hono } from 'hono'
import { desc, eq } from 'drizzle-orm'

import type { Bindings } from './types'
import { createDb } from './db/client'
import { resources } from './db/schema'

const app = new Hono<{ Bindings: Bindings }>()

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

export default app
