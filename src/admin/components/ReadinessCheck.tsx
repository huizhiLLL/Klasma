import { Icon } from '../../app/components/Icon'

export function ReadinessCheck({ issues, hasScreenshot }: { issues:string[]; hasScreenshot:boolean }) {
  return <section className="admin-section admin-readiness"><div className="admin-settings-heading"><h2>检查</h2>{issues.length > 0 && <span>{issues.length} 项待补充</span>}</div>{issues.length ? <ul className="admin-checks">{issues.map(issue => <li key={issue}><Icon name="circle-alert" />{issue}</li>)}</ul> : <p className="admin-check-ok"><Icon name="circle-check" />可以发布</p>}{!hasScreenshot && issues.length > 0 && <p className="admin-help">截图可按内容需要补充。</p>}</section>
}
