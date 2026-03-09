import { useEditor } from '../EditorContext'
import { useDropdown } from '../utils/useDropdown'
import DropdownPortal from '../utils/DropdownPortal'

const FONTS = [
  { family: 'Arial', label: 'Sans Serif' },
  { family: 'Times New Roman', label: 'Serif' },
]

export default function FontTool() {
  const { editorRef, rangeStyle } = useEditor()
  const { triggerRef, isOpen, toggle, portalStyle } = useDropdown()

  const activeFont = rangeStyle?.font || 'Arial'
  const activeLabel = FONTS.find(f => f.family === activeFont)?.label || activeFont

  const handleFont = (family: string) => {
    editorRef.current?.command.executeFont(family)
  }

  return (
    <div className="menu-item__font" ref={triggerRef} onClick={toggle}>
      <span className="select" title="Font">{activeLabel}</span>
      <DropdownPortal isOpen={isOpen} style={portalStyle} className="options visible" wrapperClassName="menu-item__font">
        <ul>
          {FONTS.map(({ family, label }) => (
            <li
              key={family}
              data-family={family}
              className={activeFont === family ? 'active' : ''}
              style={{ fontFamily: family }}
              onClick={() => handleFont(family)}
            >{label}</li>
          ))}
        </ul>
      </DropdownPortal>
    </div>
  )
}
