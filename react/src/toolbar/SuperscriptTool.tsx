import { useEditor } from '../EditorContext'

export default function SuperscriptTool() {
  const { editorRef, isApple } = useEditor()
  return (
    <div className="menu-item__superscript" title={`Superscript(${isApple ? '⌘' : 'Ctrl'}+Shift+,)`} onClick={() => editorRef.current?.command.executeSuperscript()}>
      <i></i>
    </div>
  )
}
