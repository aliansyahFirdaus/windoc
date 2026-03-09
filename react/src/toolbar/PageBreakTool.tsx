import { useEditor } from '../EditorContext'
import { useDropdown } from '../utils/useDropdown'
import DropdownPortal from '../utils/DropdownPortal'

export default function PageBreakTool() {
  const { editorRef } = useEditor()
  const { triggerRef, isOpen, toggle, portalStyle } = useDropdown()

  const handlePageBreak = () => {
    editorRef.current?.command.executePageBreak()
  }

  const handleColumnBreak = () => {
    editorRef.current?.command.executeColumnBreak()
  }

  return (
    <div
      className="menu-item__page-break"
      ref={triggerRef}
      onClick={toggle}
    >
      <i title="Break"></i>
      <DropdownPortal isOpen={isOpen} style={portalStyle} className="options visible">
        <ul>
          <li onClick={handlePageBreak}>Page Break</li>
          <li onClick={handleColumnBreak}>Column Break</li>
        </ul>
      </DropdownPortal>
    </div>
  )
}
