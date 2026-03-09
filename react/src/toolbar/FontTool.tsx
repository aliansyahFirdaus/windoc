import { useRef } from 'react'
import { useEditor } from '../EditorContext'

const FONTS = [
  { family: 'Arial', label: 'Sans Serif' },
  { family: 'Times New Roman', label: 'Serif' },
]

export default function FontTool() {
  const { editorRef, rangeStyle } = useEditor()
  const optionsRef = useRef<HTMLDivElement>(null)

  const activeFont = rangeStyle?.font || 'Arial'
  const activeLabel = FONTS.find(f => f.family === activeFont)?.label || activeFont

  const handleFont = (family: string) => {
    editorRef.current?.command.executeFont(family)
  }

  return (
    <div className="menu-item__font" onClick={() => optionsRef.current?.classList.toggle('visible')}>
      <span className="select" title="Font">{activeLabel}</span>
      <div className="options" ref={optionsRef}>
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
      </div>
    </div>
  )
}
