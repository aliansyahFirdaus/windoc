import { useState } from 'react'
import { useEditor } from '../EditorContext'

const MARGINS = [1, 1.25, 1.5, 1.75, 2, 2.5, 3]

export default function RowMarginTool() {
  const { editorRef } = useEditor()
  const [visible, setVisible] = useState(false)

  const handleRowMargin = (margin: number) => {
    editorRef.current?.command.executeRowMargin(margin)
    setVisible(false)
  }

  return (
    <div className="menu-item__row-margin" onClick={() => setVisible(!visible)}>
      <i title="Line Spacing"></i>
      <div className={`options ${visible ? 'visible' : ''}`}>
        <ul>
          {MARGINS.map(margin => (
            <li key={margin} onClick={() => handleRowMargin(margin)}>{margin}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
