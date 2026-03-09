import { useDropdown } from '../utils/useDropdown'
import DropdownPortal from '../utils/DropdownPortal'

export default function ControlTool() {
  const { triggerRef, isOpen, toggle, portalStyle } = useDropdown()

  return (
    <div className="menu-item__control" ref={triggerRef} onClick={toggle}>
      <i title="Control"></i>
      <DropdownPortal isOpen={isOpen} style={portalStyle} className="options visible" wrapperClassName="menu-item__control">
        <ul>
          <li>Text</li>
          <li>Number</li>
          <li>Select</li>
          <li>Date</li>
          <li>Checkbox</li>
          <li>Radio</li>
        </ul>
      </DropdownPortal>
    </div>
  )
}
