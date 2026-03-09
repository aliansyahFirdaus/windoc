import { useEditor } from '../EditorContext'
import { useDropdown } from '../utils/useDropdown'
import DropdownPortal from '../utils/DropdownPortal'

const MARGINS = [1, 1.25, 1.5, 1.75, 2, 2.5, 3]

export default function RowMarginTool() {
  const { editorRef } = useEditor()
  const { triggerRef, isOpen, toggle, portalStyle } = useDropdown()

  const handleRowMargin = (margin: number) => {
    editorRef.current?.command.executeRowMargin(margin)
  }

  return (
    <div className="menu-item__row-margin" ref={triggerRef} onClick={toggle}>
      <i title="Line Spacing"></i>
      <DropdownPortal isOpen={isOpen} style={portalStyle} className="options visible">
        <ul>
          {MARGINS.map(margin => (
            <li key={margin} onClick={() => handleRowMargin(margin)}>{margin}</li>
          ))}
        </ul>
      </DropdownPortal>
    </div>
  )
}
