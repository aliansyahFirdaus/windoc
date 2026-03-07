import { useEditor } from '../EditorContext'

export default function PaperMarginTool() {
  const { editorRef } = useEditor()

  const handlePaperMargin = async () => {
    if (!editorRef.current) return
    const { Dialog } = await import('@windoc/core')
    const [topMargin, rightMargin, bottomMargin, leftMargin] = editorRef.current.command.getPaperMargin()
    new Dialog({
      title: 'Page Margins',
      data: [
        { type: 'text', label: 'Top Margin', name: 'top', required: true, value: `${topMargin}`, placeholder: 'Please enter top margin' },
        { type: 'text', label: 'Bottom Margin', name: 'bottom', required: true, value: `${bottomMargin}`, placeholder: 'Please enter bottom margin' },
        { type: 'text', label: 'Left Margin', name: 'left', required: true, value: `${leftMargin}`, placeholder: 'Please enter left margin' },
        { type: 'text', label: 'Right Margin', name: 'right', required: true, value: `${rightMargin}`, placeholder: 'Please enter right margin' }
      ],
      onConfirm: (payload: Array<{ name: string; value: string }>) => {
        const top = payload.find(p => p.name === 'top')?.value
        if (!top) return
        const bottom = payload.find(p => p.name === 'bottom')?.value
        if (!bottom) return
        const left = payload.find(p => p.name === 'left')?.value
        if (!left) return
        const right = payload.find(p => p.name === 'right')?.value
        if (!right) return
        editorRef.current?.command.executeSetPaperMargin([
          Number(top), Number(right), Number(bottom), Number(left)
        ])
      }
    })
  }

  return (
    <div className="paper-margin" title="Page Margins" onClick={handlePaperMargin}>
      <i></i>
    </div>
  )
}
