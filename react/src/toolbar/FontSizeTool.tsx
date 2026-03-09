import { useEditor } from '../EditorContext'
import { useDropdown } from '../utils/useDropdown'
import DropdownPortal from '../utils/DropdownPortal'

const SIZES = [56, 48, 34, 32, 29, 24, 21, 20, 18, 16, 14, 12, 10, 8]

export default function FontSizeTool() {
  const { editorRef, rangeStyle } = useEditor()
  const { triggerRef, isOpen, toggle, portalStyle } = useDropdown()

  const activeSize = rangeStyle?.size ?? 16

  const handleSize = (size: number) => {
    editorRef.current?.command.executeSize(size)
  }

  return (
    <div className="menu-item__size" ref={triggerRef} onClick={toggle}>
      <span className="select" title="Font Size">{activeSize}</span>
      <DropdownPortal isOpen={isOpen} style={portalStyle} className="options visible">
        <ul>
          {SIZES.map(size => (
            <li
              key={size}
              className={activeSize === size ? 'active' : ''}
              onClick={() => handleSize(size)}
            >{size}</li>
          ))}
        </ul>
      </DropdownPortal>
    </div>
  )
}
