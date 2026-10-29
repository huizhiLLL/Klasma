export type IconName = 'house' | 'arrow-left' | 'x' | 'arrow-up-right' | 'rotate-ccw'
export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
 return <svg className={`ui-icon ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href={`/icons/lucide/sprite.svg#${name}`} /></svg>
}
