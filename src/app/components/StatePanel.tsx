import type { PreviewState } from '../data/model'
import { Link } from './Link'
import { Icon } from './Icon'
export function StatePanel({ state, noun = '内容', back = '/' }: { state:PreviewState | 'missing'; noun?:string; back?:string }) {
 const copy = {
  ready:['内容已就绪',''], empty:[`这里还没有${noun}`,'留一点位置，等值得留下的东西慢慢出现。'],
  error:['暂时没能读取内容','可以再试一次，或先去看看其他收藏。'], loading:['正在打开收藏','稍等片刻，内容即将出现。'],
  missing:['没有找到这份收藏','这个地址没有对应的内容，回去看看其他收藏吧。'],
 }[state]
 return <section className="state-panel" role={state === 'error' ? 'alert' : 'status'} aria-busy={state === 'loading'}><Icon name={state === 'missing' ? 'arrow-left' : 'rotate-ccw'} /><h2>{copy[0]}</h2><p>{copy[1]}</p><Link className="action" href={back}>{state === 'error' ? '重新打开' : state === 'loading' ? '返回完整预览' : '返回收藏'}</Link></section>
}
