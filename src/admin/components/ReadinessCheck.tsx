import { Icon } from '../../app/components/Icon'

export function ReadinessCheck({ issues, hasScreenshot }: { issues:string[]; hasScreenshot:boolean }) {
  return <section className="admin-section admin-readiness"><div className="admin-settings-heading"><h2>内容检查</h2><span>{issues.length ? `发布前需补充 ${issues.length} 项` : '必要信息已齐全。'}</span></div>{issues.length ? <ul className="admin-checks">{issues.map(issue => <li key={issue}><Icon name="circle-alert" />{issue}</li>)}</ul> : <p className="admin-check-ok"><Icon name="circle-check" />必要信息已齐全。</p>}{!hasScreenshot && <p className="admin-help">还没有截图，可按内容需要补充。</p>}</section>
}
