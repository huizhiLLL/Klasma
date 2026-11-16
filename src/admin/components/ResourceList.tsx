import type { Resource } from '../../shared/resource'
import { Icon } from '../../app/components/Icon'
import { StatusChip } from './StatusChip'

export function ResourceList({ items, collection, categories, formatDate, onEdit }: { items:Resource[]; collection:Resource['type']; categories:ReadonlyArray<{ slug:string; name:string }>; formatDate:(value:string)=>string; onEdit:(item:Resource)=>void }) {
  return <div className="admin-list">{items.map(item => { const image = item.assets.find(asset => asset.kind === 'icon') ?? item.assets.find(asset => asset.kind === 'cover') ?? item.assets.find(asset => asset.kind === 'screenshot'); const secondary = collection === 'library' && item.metadata.category ? (categories.find(category => category.slug === item.metadata.category)?.name ?? item.metadata.category) : item.summary || item.slug; return <article className="admin-row" key={item.id}><div className="admin-row-thumb">{image ? <img src={image.url} alt="" /> : item.title.slice(0,1) || '·'}</div><div className="admin-row-copy"><strong>{item.title}</strong><p>{secondary}</p></div><StatusChip status={item.status === 'published' ? 'published' : 'draft'} /><time dateTime={item.updatedAt}>{formatDate(item.updatedAt)}</time><button className="admin-row-action" aria-label={`编辑${item.title}`} onClick={() => onEdit(item)}><Icon name="chevron-right" /></button></article> })}</div>
}
