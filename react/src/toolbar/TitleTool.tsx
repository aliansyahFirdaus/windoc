import { useEditor } from '../EditorContext'
import { useDropdown } from '../utils/useDropdown'
import DropdownPortal from '../utils/DropdownPortal'

const LEVELS: { level: string | null; label: string }[] = [
  { level: null, label: 'Body' },
  { level: 'first', label: 'Heading 1' },
  { level: 'second', label: 'Heading 2' },
  { level: 'third', label: 'Heading 3' },
  { level: 'fourth', label: 'Heading 4' },
  { level: 'fifth', label: 'Heading 5' },
  { level: 'sixth', label: 'Heading 6' },
]

export default function TitleTool() {
  const { editorRef, rangeStyle } = useEditor()
  const { triggerRef, isOpen, toggle, portalStyle } = useDropdown()

  const activeLevel = rangeStyle?.level || null
  const activeLabel = LEVELS.find(l => l.level === activeLevel)?.label || 'Body'

  const handleTitle = (level: string | null) => {
    editorRef.current?.command.executeTitle(level)
  }

  return (
    <div className="menu-item__title" ref={triggerRef} onClick={toggle}>
      <span className="select" title="Toggle Heading">{activeLabel}</span>
      <DropdownPortal isOpen={isOpen} style={portalStyle} className="options visible" wrapperClassName="menu-item__title">
        <ul>
          {LEVELS.map(({ level, label }) => (
            <li
              key={label}
              className={activeLevel === level ? 'active' : ''}
              {...(level ? { 'data-level': level } : {})}
              onClick={() => handleTitle(level)}
            >{label}</li>
          ))}
        </ul>
      </DropdownPortal>
    </div>
  )
}
