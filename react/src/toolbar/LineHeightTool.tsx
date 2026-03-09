import { useState } from 'react'
import { useEditor } from '../EditorContext'

const LINE_HEIGHTS = ['1.0', '1.15', '1.5', '2.0', '2.5']

export default function LineHeightTool() {
  const { editorRef, rangeStyle } = useEditor()
  const [isOpen, setIsOpen] = useState(false)

  const activeMargin = rangeStyle?.rowMargin ?? 1
  const activeLabel = Number.isInteger(activeMargin) ? `${activeMargin}.0` : String(activeMargin)

  const handleLineHeight = (value: string) => {
    editorRef.current?.command.executeRowMargin(Number(value))
  }

  return (
    <div className="menu-item__line-height" onClick={() => setIsOpen(!isOpen)}>
      <span className="select" title="Line Height">{activeLabel}</span>
      <div className={'options' + (isOpen ? ' visible' : '')}>
        <ul>
          {LINE_HEIGHTS.map(h => (
            <li
              key={h}
              className={String(activeMargin) === h || activeLabel === h ? 'active' : ''}
              onClick={() => handleLineHeight(h)}
            >{h}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
