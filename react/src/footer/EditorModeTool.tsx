import { useState, useRef } from 'react'
import { useEditor } from '../EditorContext'

const MODE_LIST = [
  { mode: 'edit', name: 'Edit Mode' },
  { mode: 'clean', name: 'Clean Mode' },
  { mode: 'readonly', name: 'Read-only Mode' },
  { mode: 'form', name: 'Form Mode' },
  { mode: 'print', name: 'Print Mode' },
  { mode: 'design', name: 'Design Mode' },
  { mode: 'graffiti', name: 'Graffiti Mode' }
]

export default function EditorModeTool() {
  const { editorRef } = useEditor()
  const [editorMode, setEditorMode] = useState('Edit Mode')
  const modeIndexRef = useRef(0)

  const handleModeChange = () => {
    modeIndexRef.current = modeIndexRef.current === MODE_LIST.length - 1 ? 0 : modeIndexRef.current + 1
    const { name, mode } = MODE_LIST[modeIndexRef.current]
    setEditorMode(name)
    editorRef.current?.command.executeMode(mode)
    const isReadonly = mode === 'readonly'
    const enableMenuList = ['search', 'print']
    document.querySelectorAll<HTMLDivElement>('.menu-item>div').forEach(dom => {
      const menu = dom.dataset.menu
      if (isReadonly && (!menu || !enableMenuList.includes(menu))) {
        dom.classList.add('disable')
      } else {
        dom.classList.remove('disable')
      }
    })
  }

  return (
    <div className="editor-mode" title="Click to change mode" onClick={handleModeChange}>{editorMode}</div>
  )
}
