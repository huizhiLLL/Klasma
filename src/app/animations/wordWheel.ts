// 以最短环形距离接续当前进度，快速切换不重置位置。
export function nearestWheelPosition(current:number, selected:number, count = 3) {
 return selected + Math.round((current - selected) / count) * count
}
export type WheelInk = { left:number; ascent:number; descent:number }
export function wheelPose(position:number, index:number, ink?:readonly WheelInk[]) {
 const angle = (index - position) * Math.PI * 2 / 3
 const face = (Math.cos(angle) + 1) / 2
 const scale = .28 + .72 * Math.pow(face,1.6)
 let y = Math.sin(angle) * .88
 if (ink?.length === 3) {
  // 按可见字形留出等距空隙；混合当前朝前字面的度量，快速切换仍连续。
  const weights = ink.map((_,i) => Math.max(0,Math.cos((i - position) * Math.PI * 2 / 3)) ** 2)
  const total = weights.reduce((sum,weight) => sum + weight,0)
  const center = ink.reduce((sum,item,i) => sum + weights[i] * (item.descent - item.ascent) / 2,0) / total
  const halfHeight = ink.reduce((sum,item,i) => sum + weights[i] * (item.descent + item.ascent) / 2,0) / total
  const word = ink[index]
  const wordCenter = (word.descent - word.ascent) / 2
  const wordHalfHeight = (word.descent + word.ascent) / 2
  const inkGap = .14
  y = center - scale * wordCenter + Math.sin(angle) / Math.sin(Math.PI * 2 / 3) * (halfHeight + inkGap + scale * wordHalfHeight)
 }
 return { y,scale,opacity:Math.min(1,face * 2.4) }
}
