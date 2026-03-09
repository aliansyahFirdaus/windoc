import { useRef } from 'react'
import { useEditor } from '../EditorContext'

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
  const optionsRef = useRef<HTMLDivElement>(null)

  const activeLevel = rangeStyle?.level || null
  const activeLabel = LEVELS.find(l => l.level === activeLevel)?.label || 'Body'

  const handleTitle = (level: string | null) => {
    editorRef.current?.command.executeTitle(level)
  }

  return (
    <div className="menu-item__title" onClick={() => optionsRef.current?.classList.toggle('visible')}>
      <span className="select" title="Toggle Heading">{activeLabel}</span>
      <div className="options" ref={optionsRef}>
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
      </div>
    </div>
  )
}
