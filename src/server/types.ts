import type { D1Database, Fetcher, R2Bucket } from '@cloudflare/workers-types'

export type Bindings = {
  DB: D1Database
  ASSETS: Fetcher
  BUCKET: R2Bucket
  APP_ENV?: string
  ADMIN_KEY?: string
}
