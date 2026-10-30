import { useContext, useLayoutEffect, useId, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'
import { CollectionPresence } from '../animations/collectionPresence'
export function Dialog({ title, children, onDismiss, returnFocus, reader = false, titleClassName }: { title:string; children:ReactNode; onDismiss:()=>void; returnFocus?:string; reader?:boolean; titleClassName?:string }) {
 const dialog = useRef<HTMLDialogElement>(null)
 const id = useId()
 const present = useContext(CollectionPresence)
 useLayoutEffect(() => {
  const node = dialog.current!
  if (!present) return
  const previous = document.activeElement as HTMLElement | null
  node.showModal()
  node.querySelector<HTMLButtonElement>('button')?.focus()
  return () => {
   node.close()
   const target = previous?.isConnected && previous !== document.body ? previous : returnFocus ? document.querySelector<HTMLElement>(returnFocus) : null
   if (!target?.closest('[inert]')) target?.focus({ preventScroll:true })
  }
 }, [returnFocus,present])
 return <dialog ref={dialog} className={reader ? 'reader-dialog' : 'asset-dialog'} aria-labelledby={id} onCancel={event => { event.preventDefault(); onDismiss() }} onClick={event => {
  if (event.target !== event.currentTarget) return
  const box = event.currentTarget.getBoundingClientRect()
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onDismiss()
 }}><header className="dialog-heading"><h2 id={id} className={titleClassName}>{title}</h2><button className="icon-button" onClick={onDismiss} aria-label="关闭" title="关闭（Escape）"><Icon name="x" /></button></header>{children}</dialog>
}
