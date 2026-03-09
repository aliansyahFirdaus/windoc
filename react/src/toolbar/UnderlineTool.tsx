import { Underline as UnderlineIcon } from 'lucide-react'
import { useEditor } from '../EditorContext'
import { useDropdown } from '../utils/useDropdown'
import DropdownPortal from '../utils/DropdownPortal'

const STYLES = ['solid', 'double', 'dashed', 'dotted', 'wavy']

export default function UnderlineTool() {
  const { editorRef, isApple, rangeStyle } = useEditor()
  const { triggerRef, isOpen, toggle, portalStyle } = useDropdown()
  const isActive = rangeStyle?.underline === true

  return (
    <div className={`menu-item__underline ${isActive ? 'active' : ''}`} ref={triggerRef} title={`Underline(${isApple ? '⌘' : 'Ctrl'}+U)`}>
      <UnderlineIcon size={16} onClick={() => editorRef.current?.command.executeUnderline()} style={{ cursor: 'pointer' }} />
      <span className="select" onClick={toggle}></span>
      <DropdownPortal isOpen={isOpen} style={portalStyle} className="options visible" wrapperClassName="menu-item__underline">
        <ul>
          {STYLES.map(style => (
            <li key={style} data-decoration-style={style} onClick={() => {
              editorRef.current?.command.executeUnderline({ style })
            }}><i></i></li>
          ))}
        </ul>
      </DropdownPortal>
    </div>
  )
}
