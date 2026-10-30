import type { Collection } from '../routes.ts'

// 同集合选项变化留给各集合自己的转场，不重播外层换场。
export function collectionPose(collection:Collection, other:Collection, entering:boolean, enabled:boolean) {
 if (!enabled) return { opacity:entering ? 1 : 0,scale:1,y:0 }
 const spatial = collection === 'library' || other === 'library'
 return { opacity:0,scale:spatial ? (collection === 'library' ? .94 : .97) : 1,y:spatial ? (collection === 'library' ? 16 : -8) : (entering ? 10 : -10) }
}
