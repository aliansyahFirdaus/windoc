import { useState } from 'react'
import { useEditor } from '../EditorContext'

export default function PageBreakTool() {
  const { editorRef } = useEditor()
  const [visible, setVisible] = useState(false)

  const handlePageBreak = () => {
    editorRef.current?.command.executePageBreak()
    setVisible(false)
  }

  const handleColumnBreak = () => {
    editorRef.current?.command.executeColumnBreak()
    setVisible(false)
  }

  return (
    <div
      className="menu-item__page-break"
      onClick={() => setVisible(!visible)}
    >
      <i title="Break"></i>
      <div className={`options ${visible ? 'visible' : ''}`}>
        <ul>
          <li onClick={handlePageBreak}>Page Break</li>
          <li onClick={handleColumnBreak}>Column Break</li>
        </ul>
      </div>
    </div>
  )
}
