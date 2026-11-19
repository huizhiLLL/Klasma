import type { Asset, LibraryEntry, Tool } from './model.ts'
import { categories } from './categories.ts'
import { tools } from './tools.ts'
import { library } from './library.ts'

export { categories }

export function createCatalog(tools:readonly Tool[], entries:readonly LibraryEntry[]) {
 const byCategory = new Map<string,Asset[]>()
 for (const category of categories) {
  const assets = entries.filter(entry => entry.category === category.slug).map((entry,index) => ({
   ...entry,
   position:{ x:index % 2 ? 56 : 6,y:8 + Math.floor(index / 2) * 280,rotate:index % 2 ? 3 : -3 },
  }))
  byCategory.set(category.slug,assets)
 }
 return {
  tools:() => tools,
  tool:(slug:string) => tools.find(item => item.slug === slug),
  categories:() => categories,
  category:(slug:string) => categories.find(item => item.slug === slug),
  assets:(category:string) => byCategory.get(category) ?? [],
  asset:(category:string,slug:string) => byCategory.get(category)?.find(item => item.slug === slug),
 }
}

export type Catalog = ReturnType<typeof createCatalog>
export const staticCatalog = createCatalog(tools,library)
