import { useDropdown } from '../utils/useDropdown'
import DropdownPortal from '../utils/DropdownPortal'

export default function DateTool() {
  const { triggerRef, isOpen, toggle, portalStyle } = useDropdown()

  return (
    <div className="menu-item__date" ref={triggerRef} onClick={toggle}>
      <i title="Date"></i>
      <DropdownPortal isOpen={isOpen} style={portalStyle} className="options visible">
        <ul>
          <li data-format="yyyy-MM-dd" suppressHydrationWarning>{new Date().toISOString().split('T')[0]}</li>
          <li data-format="yyyy-MM-dd hh:mm:ss" suppressHydrationWarning>{new Date().toISOString().replace('T', ' ').slice(0, 19)}</li>
        </ul>
      </DropdownPortal>
    </div>
  )
}
