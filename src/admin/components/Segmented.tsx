export function Segmented({ value, onChange }: { value:'edit'|'preview'; onChange:(value:'edit'|'preview')=>void }) {
  return <div className="admin-segmented"><button type="button" aria-pressed={value === 'edit'} onClick={() => onChange('edit')}>编辑</button><button type="button" aria-pressed={value === 'preview'} onClick={() => onChange('preview')}>预览</button></div>
}
