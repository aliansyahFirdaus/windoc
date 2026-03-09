import { useState } from 'react'
import { useEditor } from '../EditorContext'

const MARGINS = [1, 1.25, 1.5, 1.75, 2, 2.5, 3]

export default function RowMarginTool() {
  const { editorRef } = useEditor()
  const [isOpen, setIsOpen] = useState(false)

  const handleRowMargin = (margin: number) => {
    editorRef.current?.command.executeRowMargin(margin)
  }

  return (
    <div className="menu-item__row-margin" onClick={() => setIsOpen(!isOpen)}>
      <i title="Line Spacing"></i>
      <div className={'options' + (isOpen ? ' visible' : '')}>
        <ul>
          {MARGINS.map(margin => (
            <li key={margin} onClick={() => handleRowMargin(margin)}>{margin}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
