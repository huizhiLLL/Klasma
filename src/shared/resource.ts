export const categories = [
  { slug:'sfm', name:'SFM', english:'Logic & flow', description:'代码、执行顺序与空间里的产线。', direction:'sw' },
  { slug:'blueprints', name:'机械蓝图', english:'Motion & making', description:'从传动开始，把想法搭成一条线。', direction:'se' },
  { slug:'multiblocks', name:'多方块', english:'Structure & scale', description:'模块的排列，也是一种表达。', direction:'ne' },
  { slug:'setups', name:'配置', english:'Small adjustments', description:'那些让下一次开始更轻松的调整。', direction:'nw' },
  { slug:'fragments', name:'其他碎片', english:'Room for more', description:'给还没有归类的东西留一点位置。', direction:'w' },
] as const
export type ResourceMetadata = {
  platform?:string; category?:string; assetKind?:'code' | 'line' | 'tower'; version?:string;
  footprint?:string; notes?:string; code?:string; language?:string; order?:number;
}
export type ResourceAsset = {
  id:string; filename:string; kind:'icon' | 'cover' | 'screenshot' | 'attachment';
  storageType:'r2' | 'external'; location:string; mimeType:string; size:number | null;
  metadata:{ label?:string; width?:number; height?:number; order?:number }; url:string
}
export type Resource = {
  id:string; type:'tools' | 'projects' | 'library'; slug:string; title:string; summary:string; content:string;
  metadata:ResourceMetadata; status:'draft' | 'published'; createdAt:string; updatedAt:string;
  links:Array<{ id?:string; kind:string; url:string; label:string }>;
  tags:Array<{ slug:string; label:string }>; assets:ResourceAsset[];
}
export type ResourceInput = Pick<Resource,'type' | 'slug' | 'title' | 'summary' | 'content' | 'metadata' | 'status' | 'links'> & { tagSlugs:string[] }
export function resourcePath(resource:Pick<Resource,'type' | 'slug' | 'metadata'>) {
  return resource.type === 'library' ? `/library/${resource.metadata.category || 'fragments'}/${resource.slug}` : `/${resource.type}/${resource.slug}`
}
export function safeUrl(value:string) {
  try { return ['http:','https:'].includes(new URL(value).protocol) } catch { return false }
}
export function publicationErrors(input:ResourceInput, assets:ResourceAsset[]):string[] {
  const errors:string[] = []
  if (!input.summary.trim()) errors.push('请填写简短说明。')
  if (input.type === 'tools') {
    if (!assets.some(asset => asset.kind === 'icon')) errors.push('请添加软件图标。')
    if (!input.links.length) errors.push('请添加访问或下载链接。')
  }
  if (input.type === 'library') {
    if (!categories.some(item => item.slug === input.metadata.category)) errors.push('请选择工程资产分类。')
    if (!input.content.trim() && !input.metadata.code?.trim() && !assets.length && !input.links.length) errors.push('请添加正文、代码、文件或外部链接。')
  }
  return errors
}
