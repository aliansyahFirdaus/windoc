import { AlignRight } from 'lucide-react'
import { useEditor } from '../EditorContext'

export default function RightAlignTool() {
  const { editorRef, isApple, rangeStyle } = useEditor()
  const isActive = rangeStyle?.rowFlex === 'right'
  return (
    <div className={`menu-item__right ${isActive ? 'active' : ''}`} title={`Right align(${isApple ? '⌘' : 'Ctrl'}+R)`} onClick={() => editorRef.current?.command.executeRowFlex('right')}>
      <AlignRight size={16} />
    </div>
  )
}
