import type { Asset, Tool } from './model.ts'
import { categories, type Resource } from '../../shared/resource.ts'
export { categories }
export function createCatalog(resources:Resource[]) {
 const sorted = resources.filter(item => item.status === 'published').sort((a,b) => (a.metadata.order ?? 0) - (b.metadata.order ?? 0) || a.title.localeCompare(b.title,'zh-CN'))
 const tools:Tool[] = sorted.filter(item => item.type === 'tools').map(item => ({
  slug:item.slug,name:item.title,monogram:Array.from(item.title)[0] || '?',tone:'gray',icon:item.assets.find(asset => asset.kind === 'icon')?.url,
  platform:[item.metadata.platform,item.metadata.version].filter(Boolean).join(' · '),tagline:item.summary,article:item.content,
  media:item.assets.filter(asset => asset.kind === 'screenshot' || asset.kind === 'cover').sort((a,b) => (a.metadata.order ?? 0) - (b.metadata.order ?? 0)).map(asset => ({ id:asset.id,label:asset.metadata.label || asset.filename,caption:asset.metadata.label || '',src:asset.url,variant:'clean',width:asset.metadata.width || 1280,height:asset.metadata.height || 800 })),
  links:item.links.map(link => ({ label:link.label || ({ website:'官网',github:'仓库',download:'下载',article:'文章',other:'访问链接' }[link.kind] ?? '访问链接'),url:link.url })).concat(item.assets.filter(asset => asset.kind === 'attachment').map(asset => ({ label:asset.metadata.label || asset.filename,url:asset.url }))),
 }))
 const assets:Asset[] = sorted.filter(item => item.type === 'library').map(item => {
  const images = item.assets.filter(asset => asset.kind === 'cover' || asset.kind === 'screenshot').sort((a,b) => (a.kind === 'cover' ? -1 : 0) - (b.kind === 'cover' ? -1 : 0) || (a.metadata.order ?? 0) - (b.metadata.order ?? 0))
  return { slug:item.slug,category:item.metadata.category || 'fragments',title:item.title,subtitle:item.summary,kind:item.metadata.assetKind || 'line',description:item.content,notes:item.metadata.notes || '',tags:item.tags.map(tag => tag.label),code:item.metadata.code,footprint:item.metadata.footprint || '',version:item.metadata.version || '',position:{ x:0,y:0,rotate:0 },cover:images[0]?.url,media:images.map(asset => ({ src:asset.url,label:asset.metadata.label || asset.filename })),links:item.links.map(link => ({ label:link.label || '访问链接',url:link.url })),attachments:item.assets.filter(asset => asset.kind === 'attachment').map(asset => ({ filename:asset.filename,href:asset.url })) }
 })
 // Keep each category's scene readable as the collection grows.
 for (const category of categories) assets.filter(item => item.category === category.slug).forEach((asset,index) => { asset.position = { x:index % 2 ? 56 : 6,y:8 + Math.floor(index / 2) * 280,rotate:index % 2 ? 3 : -3 } })
 return { tools:() => tools,tool:(slug:string) => tools.find(item => item.slug === slug),categories:() => categories,category:(slug:string) => categories.find(item => item.slug === slug),assets:(category:string) => assets.filter(item => item.category === category),asset:(category:string,slug:string) => assets.find(item => item.category === category && item.slug === slug) }
}
export type Catalog = ReturnType<typeof createCatalog>
