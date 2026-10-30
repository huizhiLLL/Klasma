import type { Media } from '../../data/model.ts'

export function usesPortraitMedia(media:readonly Media[]) {
 return media.length > 0 && media.every(item => item.width < item.height)
}
export function mediaThumbnailSize(media:Media) {
 const scale = Math.min(80 / media.width,50 / media.height)
 const width = media.width * scale, height = media.height * scale
 return { scale,width,height,buttonWidth:Math.max(44,width + 8),buttonHeight:Math.max(44,height + 8) }
}
// 全组图片共用宽度，避免轮播切换时挤动介绍区；给文字保留最低阅读宽度。
export function mediaColumnWidth(media:readonly Media[], width:number, height:number, stripHeight:number, gap:number) {
 const ratio = Math.max(...media.map(item => item.width / item.height),0)
 if (!ratio) return undefined
 const portrait = usesPortraitMedia(media)
 const controlsWidth = portrait && media.length > 1 ? 112 : 0
 const imageHeight = Math.max(0,height - (!portrait && stripHeight ? stripHeight + 16 : 0))
 return Math.max(0,Math.min(imageHeight * ratio + controlsWidth,width - gap - 280))
}
