import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { navigate } from '../routing'

export function Link({ href = '/', onClick, children, preserveScroll = false, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { preserveScroll?:boolean }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.download !== undefined || props.target && props.target !== '_self') return
    const url = new URL(href, window.location.href)
    if (url.origin !== window.location.origin || url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return
    event.preventDefault()
    navigate(href, { preserveScroll })
  }
  return <a {...props} href={href} onClick={handleClick}>{children}</a>
}
