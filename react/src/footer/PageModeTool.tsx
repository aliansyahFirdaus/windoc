import { useState } from 'react'
import { useEditor } from '../EditorContext'

export default function PageModeTool() {
  const { editorRef } = useEditor()
  const [visible, setVisible] = useState(false)

  const handlePageMode = (mode: string) => {
    editorRef.current?.command.executePageMode(mode)
    setVisible(false)
  }

  return (
    <div className="page-mode" onClick={() => setVisible(!visible)}>
      <i title="Page Mode"></i>
      <div className={`options ${visible ? 'visible' : ''}`}>
        <ul>
          <li onClick={() => handlePageMode('paging')} className="active">Paging</li>
          <li onClick={() => handlePageMode('continuity')}>Continuity</li>
        </ul>
      </div>
    </div>
  )
}
