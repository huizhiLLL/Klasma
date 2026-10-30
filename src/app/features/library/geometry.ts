export function point(angle:number, radius:number) {
 const radians = angle * Math.PI / 180
 return { x:250 + Math.cos(radians) * radius, y:250 + Math.sin(radians) * radius }
}
export function sectorPath(start:number, end:number) {
 const a = point(start,218), b = point(end,218), c = point(end,66), d = point(start,66)
 return `M ${a.x} ${a.y} A 218 218 0 0 1 ${b.x} ${b.y} L ${c.x} ${c.y} A 66 66 0 0 0 ${d.x} ${d.y} Z`
}
export const sectors = [[90,180],[0,90],[288,360],[216,288],[180,216]] as const

export type CategoryDirection = 'sw' | 'se' | 'ne' | 'nw' | 'w'
export type ReturnDirection = 'ne' | 'nw' | 'sw' | 'se' | 'e'
export function returnDirection(direction:CategoryDirection):ReturnDirection {
 const opposite = { sw:'ne',se:'nw',ne:'sw',nw:'se',w:'e' } as const
 return opposite[direction]
}
