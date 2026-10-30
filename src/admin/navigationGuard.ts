/** Keep unsaved editor content when same-document browser history leaves /admin. */
export function installEditorGuard(target:Window,confirmLeave:()=>boolean) {
 const href = target.location.href
 const beforeUnload = (event:BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
 const pop = (event:PopStateEvent) => {
  if (target.location.href === href || confirmLeave()) return
  event.stopImmediatePropagation()
  target.history.pushState({},'',href)
 }
 target.addEventListener('beforeunload',beforeUnload)
 target.addEventListener('popstate',pop,true)
 return () => { target.removeEventListener('beforeunload',beforeUnload); target.removeEventListener('popstate',pop,true) }
}
