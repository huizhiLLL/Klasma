export function StatusChip({ status }: { status:'draft'|'published' }) {
  return <span className={`admin-status status-${status}`}><i />{status === 'published' ? '已发布' : '草稿'}</span>
}
