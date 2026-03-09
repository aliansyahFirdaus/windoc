import { useEditor } from '../EditorContext'
import { useDropdown } from '../utils/useDropdown'
import DropdownPortal from '../utils/DropdownPortal'

export default function InsertElementTool() {
  const { editorRef } = useEditor()
  const { triggerRef, isOpen, toggle, portalStyle } = useDropdown()

  const handleHeader = () => {
    if (!editorRef.current) return
    const options = editorRef.current.command.getOptions()
    if (options.header.disabled) {
      // Header doesn't exist yet — enable it
      options.header.disabled = false
      editorRef.current.command.executeForceUpdate()
    }
    // Navigate to header zone for editing
    editorRef.current.command.executeSetZone('header')
  }

  return (
    <div className="menu-item__insert-element" ref={triggerRef} onClick={toggle}>
      <i title="Insert Element"></i>
      <DropdownPortal isOpen={isOpen} style={portalStyle} className="options visible" wrapperClassName="menu-item__insert-element">
        <ul>
          <li onClick={handleHeader}>Add Header</li>
        </ul>
      </DropdownPortal>
    </div>
  )
}
