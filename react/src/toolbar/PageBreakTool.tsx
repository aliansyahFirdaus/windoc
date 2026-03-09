import { useRef } from 'react'
import { useEditor } from '../EditorContext'

export default function PageBreakTool() {
  const { editorRef } = useEditor()
  const optionsRef = useRef<HTMLDivElement>(null)

  const handlePageBreak = () => {
    editorRef.current?.command.executePageBreak()
  }

  const handleColumnBreak = () => {
    editorRef.current?.command.executeColumnBreak()
  }

  return (
    <div
      className="menu-item__page-break"
      onClick={() => optionsRef.current?.classList.toggle('visible')}
    >
      <i title="Break"></i>
      <div className="options" ref={optionsRef}>
        <ul>
          <li onClick={handlePageBreak}>Page Break</li>
          <li onClick={handleColumnBreak}>Column Break</li>
        </ul>
      </div>
    </div>
  )
}
