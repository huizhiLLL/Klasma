import { Icon } from '../../app/components/Icon'

export function EditorBar({ title, status, tone, busy, onBack, onPublish, published }: { title:string; status:string; tone:'busy'|'unsaved'|'saved'|'new'; busy:boolean; onBack:()=>void; onPublish:()=>void; published:boolean }) {
  return <div className="admin-editor-bar"><button className="admin-btn admin-btn--icon admin-btn--ghost" aria-label="返回列表" type="button" disabled={busy} onClick={onBack}><Icon name="arrow-left" /></button><h1>{title}</h1><span className={`admin-editor-status status-${tone}`} role="status"><i />{status}</span><button className="admin-btn" aria-label="保存" disabled={busy} type="submit">保存</button>{!published && <button className="admin-btn admin-btn--primary" aria-label="发布" disabled={busy} type="button" onClick={onPublish}>发布</button>}</div>
}
