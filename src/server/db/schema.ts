import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  label: text('label').notNull(),
})

export const resourceTags = sqliteTable('resource_tags', {
  resourceId: text('resource_id').notNull().references(() => resources.id),
  tagId: text('tag_id').notNull().references(() => tags.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.resourceId, table.tagId] }),
}))

export const resourceAssets = sqliteTable('resource_assets', {
  id: text('id').primaryKey(),
  resourceId: text('resource_id').notNull().references(() => resources.id),
  kind: text('kind').notNull(),
  filename: text('filename').notNull(),
  storageType: text('storage_type', { enum: ['r2', 'external'] }).notNull(),
  location: text('location').notNull(),
  mimeType: text('mime_type').notNull().default('application/octet-stream'),
  size: integer('size'),
  metadata: text('metadata').notNull().default('{}'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
