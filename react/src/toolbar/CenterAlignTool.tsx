import { AlignCenter } from 'lucide-react'
import { useEditor } from '../EditorContext'

export default function CenterAlignTool() {
  const { editorRef, isApple, rangeStyle } = useEditor()
  const isActive = rangeStyle?.rowFlex === 'center'
  return (
    <div className={`menu-item__center ${isActive ? 'active' : ''}`} title={`Center align(${isApple ? '⌘' : 'Ctrl'}+E)`} onClick={() => editorRef.current?.command.executeRowFlex('center')}>
      <AlignCenter size={16} />
    </div>
  )
}
