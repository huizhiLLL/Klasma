export type Resource = {
  id: string
  type: 'tools' | 'projects' | 'library'
  slug: string
  title: string
  summary: string
  content?: string
  status: 'draft' | 'published'
  links?: Array<{ id?: string; kind: string; url: string; label: string }>
  tags?: Array<{ slug: string; label: string }>
  assets?: Array<{ id: string; filename: string; kind: string }>
}
