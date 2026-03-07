import { useState } from 'react'
import { useEditor } from '../EditorContext'

const SIZES = [56, 48, 34, 32, 29, 24, 21, 20, 18, 16, 14, 12, 10, 8]

export default function FontSizeTool() {
  const { editorRef, rangeStyle } = useEditor()
  const [visible, setVisible] = useState(false)

  const activeSize = rangeStyle?.size ?? 16

  const handleSize = (size: number) => {
    editorRef.current?.command.executeSize(size)
    setVisible(false)
  }

  return (
    <div className="menu-item__size" onClick={() => setVisible(!visible)}>
      <span className="select" title="Font Size">{activeSize}</span>
      <div className={`options ${visible ? 'visible' : ''}`}>
        <ul>
          {SIZES.map(size => (
            <li
              key={size}
              className={activeSize === size ? 'active' : ''}
              onClick={() => handleSize(size)}
            >{size}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
