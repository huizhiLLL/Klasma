import type { ComponentType } from 'react'

export type Project = {
  slug: string
  name: string
  logo: string
  order: number
  links: Array<{ label: string; url: string }>
  load: () => Promise<{ default: ComponentType }>
}

export const projects: Project[] = []
