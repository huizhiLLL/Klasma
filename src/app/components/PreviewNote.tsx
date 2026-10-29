import { Link } from './Link'
export function PreviewNote({ path, search }: { path:string; search:string }) {
 const params = new URLSearchParams(search)
 return <footer className="review-note"><span>设计预览 · 内容为示例</span><details><summary>查看其他状态</summary><div className="review-options">{[['ready','完整内容'],['empty','空内容'],['error','读取失败'],['loading','加载中']].map(([value,label]) => {
  const next = new URLSearchParams(params)
  if (value === 'ready') next.delete('preview'); else next.set('preview',value)
  return <Link href={`${path}${next.size ? `?${next}` : ''}`} key={value}>{label}</Link>
 })}</div></details><span>MiSans / Manrope</span></footer>
}
