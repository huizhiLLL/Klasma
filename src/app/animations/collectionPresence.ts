import { createContext } from 'react'

// 跨过集合内部的 AnimatePresence，及时关闭退场集合中的顶层 dialog。
export const CollectionPresence = createContext(true)
