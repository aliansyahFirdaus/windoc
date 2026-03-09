import { useRef } from 'react'
import { useEditor } from '../EditorContext'

const SIZES = [56, 48, 34, 32, 29, 24, 21, 20, 18, 16, 14, 12, 10, 8]

export default function FontSizeTool() {
  const { editorRef, rangeStyle } = useEditor()
  const optionsRef = useRef<HTMLDivElement>(null)

  const activeSize = rangeStyle?.size ?? 16

  const handleSize = (size: number) => {
    editorRef.current?.command.executeSize(size)
  }

  return (
    <div className="menu-item__size" onClick={() => optionsRef.current?.classList.toggle('visible')}>
      <span className="select" title="Font Size">{activeSize}</span>
      <div className="options" ref={optionsRef}>
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
