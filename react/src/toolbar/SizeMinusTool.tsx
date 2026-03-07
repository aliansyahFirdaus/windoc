import { useEditor } from '../EditorContext'

export default function SizeMinusTool() {
  const { editorRef, isApple } = useEditor()
  return (
    <div className="menu-item__size-minus" title={`Decrease font size(${isApple ? '⌘' : 'Ctrl'}+])`} onClick={() => editorRef.current?.command.executeSizeMinus()}>
      <i></i>
    </div>
  )
}
