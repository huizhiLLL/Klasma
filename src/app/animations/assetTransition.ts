import { flushSync } from 'react-dom'
let revision = 0
let active:ViewTransition | null = null
let activeSource:HTMLElement | null = null

// 原生快照位于 dialog 顶层之上，避免跨层媒体被弹窗滚动边界裁剪。
// 来源和目标分时命名，任何一帧都不会出现重名的共享元素。
export function transitionAsset(source:HTMLElement | null, update:()=>void, enabled:boolean, opening:boolean) {
 const request = ++revision
 active?.skipTransition()
 activeSource?.removeAttribute('data-shared-asset')
 active = null
 activeSource = source
 const finish = () => {
  if (request !== revision) return
  source?.removeAttribute('data-shared-asset')
  delete document.documentElement.dataset.assetDetailTransition
  activeSource = null
  active = null
 }
 if (!enabled || !source || typeof document.startViewTransition !== 'function') {
  flushSync(update)
  finish()
  return
 }
 document.documentElement.dataset.assetDetailTransition = 'true'
 if (opening) source.dataset.sharedAsset = 'true'
 const transition = document.startViewTransition(() => {
  if (request !== revision) return
  flushSync(update)
  if (opening) source.removeAttribute('data-shared-asset')
  else source.dataset.sharedAsset = 'true'
 })
 active = transition
 void transition.finished.finally(finish).catch(() => {})
}
