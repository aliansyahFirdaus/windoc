import { useRef } from 'react'
import { Underline as UnderlineIcon } from 'lucide-react'
import { useEditor } from '../EditorContext'

const STYLES = ['solid', 'double', 'dashed', 'dotted', 'wavy']

export default function UnderlineTool() {
  const { editorRef, isApple, rangeStyle } = useEditor()
  const optionsRef = useRef<HTMLDivElement>(null)
  const isActive = rangeStyle?.underline === true

  return (
    <div className={`menu-item__underline ${isActive ? 'active' : ''}`} title={`Underline(${isApple ? '⌘' : 'Ctrl'}+U)`}>
      <UnderlineIcon size={16} onClick={() => editorRef.current?.command.executeUnderline()} style={{ cursor: 'pointer' }} />
      <span className="select" onClick={() => optionsRef.current?.classList.toggle('visible')}></span>
      <div className="options" ref={optionsRef}>
        <ul>
          {STYLES.map(style => (
            <li key={style} data-decoration-style={style} onClick={() => {
              editorRef.current?.command.executeUnderline({ style })
            }}><i></i></li>
          ))}
        </ul>
      </div>
    </div>
  )
}
