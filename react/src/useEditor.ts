import { useEffect, useRef, useState } from 'react'
import type EditorClass from '@windoc/core'
import type { IEditorData, IEditorOption } from '@windoc/core'

type EditorInstance = InstanceType<typeof EditorClass>

interface UseEditorOptions {
  defaultValue?: IEditorData
  options?: IEditorOption
}

export function useEditor({ defaultValue, options }: UseEditorOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<EditorInstance | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let instance: EditorInstance | null = null

    import('@windoc/core').then((mod) => {
      const Editor = mod.default
      const data = defaultValue ?? { main: [] }
      instance = new Editor(containerRef.current!, data, options ?? {})
      setEditor(instance)
    })

    return () => {
      instance?.destroy()
    }
  }, [])

  return { containerRef, editor }
}
