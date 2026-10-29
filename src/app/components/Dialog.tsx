import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'
export function Dialog({ title, children, onDismiss, returnFocus, reader = false }: { title:string; children:ReactNode; onDismiss:()=>void; returnFocus?:string; reader?:boolean }) {
 const dialog = useRef<HTMLDialogElement>(null)
 const id = useId()
 useEffect(() => {
  const node = dialog.current!
  const previous = document.activeElement as HTMLElement | null
  node.showModal()
  node.querySelector<HTMLButtonElement>('button')?.focus()
  return () => {
   node.close()
   const target = previous?.isConnected ? previous : returnFocus ? document.querySelector<HTMLElement>(returnFocus) : null
   target?.focus({ preventScroll:true })
  }
 }, [returnFocus])
 return <dialog ref={dialog} className={reader ? 'reader-dialog' : 'asset-dialog'} aria-labelledby={id} onCancel={event => { event.preventDefault(); onDismiss() }} onClick={event => {
  if (event.target !== event.currentTarget) return
  const box = event.currentTarget.getBoundingClientRect()
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onDismiss()
 }}><header className="dialog-heading"><h2 id={id}>{title}</h2><button className="icon-button" onClick={onDismiss} aria-label="关闭" title="关闭（Escape）"><Icon name="x" /></button></header>{children}</dialog>
}
