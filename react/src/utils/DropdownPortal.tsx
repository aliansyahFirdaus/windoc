import { createPortal } from 'react-dom'
import { CSSProperties, ReactNode } from 'react'

interface DropdownPortalProps {
  isOpen: boolean
  style: CSSProperties
  className?: string
  children: ReactNode
}

export default function DropdownPortal({ isOpen, style, className, children }: DropdownPortalProps) {
  if (!isOpen) return null
  return createPortal(
    <div className={className} style={style}>
      {children}
    </div>,
    document.body
  )
}
