import type { ReactNode } from 'react'
import { Icon } from '../../app/components/Icon'

export function Disclosure({ title, meta, children, defaultOpen = false, open }: { title:string; meta?:string; children:ReactNode; defaultOpen?:boolean; open?:boolean }) {
  const props = open === undefined ? { defaultOpen } : { open }
  return <details className="admin-section admin-disclosure" {...props}><summary><h2>{title}</h2>{meta && <span>{meta}</span>}<Icon name="chevron-down" /></summary>{children}</details>
}
