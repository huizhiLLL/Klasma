import type { Media } from '../../data/model.ts'

// 全组图片共用宽度，避免轮播切换时挤动介绍区；给文字保留最低阅读宽度。
export function mediaColumnWidth(media:readonly Media[], width:number, height:number, stripHeight:number, gap:number) {
 const ratio = Math.max(...media.map(item => item.width / item.height),0)
 if (!ratio) return undefined
 const imageHeight = Math.max(0,height - (stripHeight ? stripHeight + 16 : 0))
 return Math.max(0,Math.min(imageHeight * ratio,width - gap - 280))
}
