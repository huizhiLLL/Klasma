import { Icon } from '../../app/components/Icon'
import { StatusChip } from './StatusChip'

export function EditorBar({ title, busy, onBack, onPublish, resourceStatus, published }: { title:string; busy:boolean; onBack:()=>void; onPublish:()=>void; resourceStatus:'draft'|'published'; published:boolean }) {
  return <div className="admin-editor-bar"><button className="admin-btn admin-btn--icon admin-btn--ghost" aria-label="返回列表" type="button" disabled={busy} onClick={onBack}><Icon name="arrow-left" /></button><h1>{title}</h1><StatusChip status={resourceStatus} /><button className="admin-btn" aria-label="保存" disabled={busy} type="submit">保存</button>{!published && <button className="admin-btn admin-btn--primary" aria-label="发布" disabled={busy} type="button" onClick={onPublish}>发布</button>}</div>
}
