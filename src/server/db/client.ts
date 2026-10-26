import { drizzle } from 'drizzle-orm/d1'
import type { D1Database } from '@cloudflare/workers-types'

import * as schema from './schema'

export const createDb = (database: D1Database) => drizzle(database, { schema })
