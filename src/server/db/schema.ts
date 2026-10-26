import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const resources = sqliteTable('resources', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['tools', 'projects', 'library'] }).notNull(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull().default(''),
  content: text('content').notNull().default(''),
  metadata: text('metadata').notNull().default('{}'),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const resourceLinks = sqliteTable('resource_links', {
  id: text('id').primaryKey(),
  resourceId: text('resource_id').notNull().references(() => resources.id),
  kind: text('kind').notNull(),
  url: text('url').notNull(),
  label: text('label').notNull().default(''),
})
