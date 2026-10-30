// 以最短环形距离接续当前进度，快速切换不重置位置。
export function nearestWheelPosition(current:number, selected:number, count = 3) {
 return selected + Math.round((current - selected) / count) * count
}
export type WheelInk = { left:number; ascent:number; descent:number; opticalAscent?:number; opticalDescent?:number }
// 以中间 90% 墨迹确定字形主体，减少细长升部 / 下伸部对视觉间距的影响。
export function opticalInkBounds(rows:readonly number[], baseline:number, em:number) {
 const total = rows.reduce((sum,value) => sum + value,0)
 if (!total) return undefined
 let accumulated = 0, top = -1, bottom = rows.length - 1
 for (let row = 0; row < rows.length; row++) {
  accumulated += rows[row]
  if (top < 0 && accumulated >= total * .05) top = row
  if (accumulated >= total * .95) { bottom = row; break }
 }
 return { ascent:(baseline - top) / em,descent:(bottom + 1 - baseline) / em }
}
export function wheelPose(position:number, index:number, ink?:readonly WheelInk[]) {
 const angle = (index - position) * Math.PI * 2 / 3
 const face = (Math.cos(angle) + 1) / 2
 const scale = .28 + .72 * Math.pow(face,1.6)
 let y = Math.sin(angle) * .88
 if (ink?.length === 3) {
  // 按字形主体留出等距空隙；混合当前朝前字面的度量，快速切换仍连续。
  const body = ink.map(item => ({ ascent:item.opticalAscent ?? item.ascent,descent:item.opticalDescent ?? item.descent }))
  const weights = ink.map((_,i) => Math.max(0,Math.cos((i - position) * Math.PI * 2 / 3)) ** 2)
  const total = weights.reduce((sum,weight) => sum + weight,0)
  const center = body.reduce((sum,item,i) => sum + weights[i] * (item.descent - item.ascent) / 2,0) / total
  const halfHeight = body.reduce((sum,item,i) => sum + weights[i] * (item.descent + item.ascent) / 2,0) / total
  const word = body[index]
  const wordCenter = (word.descent - word.ascent) / 2
  const wordHalfHeight = (word.descent + word.ascent) / 2
  const inkGap = ink.every(item => item.opticalAscent !== undefined) ? .36 : .14
  y = center - scale * wordCenter + Math.sin(angle) / Math.sin(Math.PI * 2 / 3) * (halfHeight + inkGap + scale * wordHalfHeight)
 }
 return { y,scale,opacity:Math.min(1,face * 2.4) }
}
