import { Link } from '../../components/Link'
import { Icon } from '../../components/Icon'
import { returnDirection, type CategoryDirection } from './geometry'
export function SceneReturn({ direction }: { direction:CategoryDirection }) {
 const opposite = returnDirection(direction)
 return <Link className={`scene-return return-${opposite}`} href="/library" aria-label="返回全局视图" title="返回全局视图"><svg className="return-arc" viewBox={opposite === 'e' ? '0 0 144 288' : '0 0 144 144'} aria-hidden="true"><path d={opposite === 'e' ? 'M144 0 A144 144 0 0 0 144 288 Z' : 'M0 0 H144 A144 144 0 0 1 0 144 Z'} /></svg><span className="return-label"><Icon name="arrow-left" /><span>全局</span></span></Link>
}
