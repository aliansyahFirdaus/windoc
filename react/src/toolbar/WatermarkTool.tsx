import { useState } from 'react'
import { useEditor } from '../EditorContext'

export default function InsertElementTool() {
  const { editorRef } = useEditor()
  const [isOpen, setIsOpen] = useState(false)

  const handleHeader = () => {
    if (!editorRef.current) return
    const options = editorRef.current.command.getOptions()
    if (options.header.disabled) {
      // Header doesn't exist yet — enable it
      options.header.disabled = false
      editorRef.current.command.executeForceUpdate()
    }
    // Navigate to header zone for editing
    editorRef.current.command.executeSetZone('header')
  }

  return (
    <div className="menu-item__insert-element" onClick={() => setIsOpen(!isOpen)}>
      <i title="Insert Element"></i>
      <div className={'options' + (isOpen ? ' visible' : '')}>
        <ul>
          <li onClick={handleHeader}>Add Header</li>
        </ul>
      </div>
    </div>
  )
}
