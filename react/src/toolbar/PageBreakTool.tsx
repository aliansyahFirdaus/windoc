import { useState } from 'react'
import { useEditor } from '../EditorContext'

export default function PageBreakTool() {
  const { editorRef } = useEditor()
  const [isOpen, setIsOpen] = useState(false)

  const handlePageBreak = () => {
    editorRef.current?.command.executePageBreak()
  }

  const handleColumnBreak = () => {
    editorRef.current?.command.executeColumnBreak()
  }

  return (
    <div
      className="menu-item__page-break"
      onClick={() => setIsOpen(!isOpen)}
    >
      <i title="Break"></i>
      <div className={'options' + (isOpen ? ' visible' : '')}>
        <ul>
          <li onClick={handlePageBreak}>Page Break</li>
          <li onClick={handleColumnBreak}>Column Break</li>
        </ul>
      </div>
    </div>
  )
}
