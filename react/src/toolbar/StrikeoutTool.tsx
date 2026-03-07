import { Strikethrough } from 'lucide-react'
import { useEditor } from '../EditorContext'

export default function StrikeoutTool() {
  const { editorRef, rangeStyle } = useEditor()
  const isActive = rangeStyle?.strikeout === true
  return (
    <div className={`menu-item__strikeout ${isActive ? 'active' : ''}`} title="Strikethrough" onClick={() => editorRef.current?.command.executeStrikeout()}>
      <Strikethrough size={16} />
    </div>
  )
}
