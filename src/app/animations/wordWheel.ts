// 以最短环形距离接续当前进度，快速切换不重置位置。
export function nearestWheelPosition(current:number, selected:number, count = 3) {
 return selected + Math.round((current - selected) / count) * count
}
export function wheelPose(position:number, index:number) {
 const angle = (index - position) * Math.PI * 2 / 3
 const face = (Math.cos(angle) + 1) / 2
 return { y:Math.sin(angle) * .8, scale:Math.max(.18,Math.pow(face,1.6)), opacity:Math.min(1,face * 2.4) }
}
