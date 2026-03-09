import { useEditor } from '../EditorContext'
import { useDropdown } from '../utils/useDropdown'
import DropdownPortal from '../utils/DropdownPortal'

const LINE_HEIGHTS = ['1.0', '1.15', '1.5', '2.0', '2.5']

export default function LineHeightTool() {
  const { editorRef, rangeStyle } = useEditor()
  const { triggerRef, isOpen, toggle, portalStyle } = useDropdown()

  const activeMargin = rangeStyle?.rowMargin ?? 1
  const activeLabel = Number.isInteger(activeMargin) ? `${activeMargin}.0` : String(activeMargin)

  const handleLineHeight = (value: string) => {
    editorRef.current?.command.executeRowMargin(Number(value))
  }

  return (
    <div className="menu-item__line-height" ref={triggerRef} onClick={toggle}>
      <span className="select" title="Line Height">{activeLabel}</span>
      <DropdownPortal isOpen={isOpen} style={portalStyle} className="options visible" wrapperClassName="menu-item__line-height">
        <ul>
          {LINE_HEIGHTS.map(h => (
            <li
              key={h}
              className={String(activeMargin) === h || activeLabel === h ? 'active' : ''}
              onClick={() => handleLineHeight(h)}
            >{h}</li>
          ))}
        </ul>
      </DropdownPortal>
    </div>
  )
}
