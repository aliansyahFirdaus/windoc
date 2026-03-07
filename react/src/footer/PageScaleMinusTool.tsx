import { useEditor } from '../EditorContext'

export default function PageScaleMinusTool() {
  const { editorRef } = useEditor()
  return (
    <div className="page-scale-minus" title="Zoom Out (Ctrl+-)" onClick={() => editorRef.current?.command.executePageScaleMinus()}>
      <i></i>
    </div>
  )
}
