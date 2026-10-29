import { assets, categories, tools } from './fixtures.ts'
/** 公开前台当前唯一的动态内容入口；评审后在此边界替换为 API 适配。 */
export const catalog = {
 tools: () => tools,
 tool: (slug:string) => tools.find(item => item.slug === slug),
 categories: () => categories,
 category: (slug:string) => categories.find(item => item.slug === slug),
 assets: (category:string) => assets.filter(item => item.category === category),
 asset: (category:string, slug:string) => assets.find(item => item.category === category && item.slug === slug),
}
