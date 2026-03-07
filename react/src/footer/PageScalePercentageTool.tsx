import { useEditor } from '../EditorContext'
import { useFooter } from '../FooterContext'

export default function PageScalePercentageTool() {
  const { editorRef } = useEditor()
  const { pageScale } = useFooter()
  return (
    <span className="page-scale-percentage" title="Zoom Level" onClick={() => editorRef.current?.command.executePageScaleRecovery()}>
      {pageScale}%
    </span>
  )
}
