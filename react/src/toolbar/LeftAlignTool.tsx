import { AlignLeft } from 'lucide-react'
import { useEditor } from '../EditorContext'

export default function LeftAlignTool() {
  const { editorRef, isApple, rangeStyle } = useEditor()
  const isActive = !rangeStyle?.rowFlex || rangeStyle.rowFlex === 'left'
  return (
    <div className={`menu-item__left ${isActive ? 'active' : ''}`} title={`Left align(${isApple ? '⌘' : 'Ctrl'}+L)`} onClick={() => editorRef.current?.command.executeRowFlex('left')}>
      <AlignLeft size={16} />
    </div>
  )
}
