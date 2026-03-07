---
sidebar_position: 3
---

# Drag and Drop

Windoc supports drag-and-drop insertion via the `onDrop` prop. This is useful for inserting badges, components, or custom elements from external UI into the editor.

## Basic Example

```tsx
import { Editor } from '@windoc/react'
import type { EditorInstance } from '@windoc/react'

function App() {
  const handleDrop = (e: React.DragEvent, editor: EditorInstance) => {
    e.preventDefault()
    const text = e.dataTransfer.getData('text/plain')
    if (!text) return

    editor.command.executeInsertElementList([
      { value: text },
    ])
  }

  return <Editor onDrop={handleDrop} />
}
```

## Inserting Badges

A common pattern is dragging components from a sidebar and inserting them as labeled badges:

```tsx
const handleDrop = (e: React.DragEvent, editor: EditorInstance) => {
  e.preventDefault()
  const data = e.dataTransfer.getData('application/component-badge')
  if (!data) return

  const { componentId, componentName } = JSON.parse(data)
  const badgeId = crypto.randomUUID()

  editor.command.executeInsertElementList([
    {
      type: 'label',
      value: componentName,
      id: badgeId,
      labelId: badgeId,
      size: 14,
      label: {
        backgroundColor: '#E8F5F0',
        color: '#2D6B4A',
        borderColor: '#B8DCC9',
        borderRadius: 6,
        padding: [4, 8, 4, 6],
      },
      extension: {
        componentId,
        name: componentName,
      },
    },
  ])
}
```

## Draggable Source

On the draggable side, set the data transfer:

```tsx
function DraggableItem({ id, name }: { id: string; name: string }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/component-badge',
      JSON.stringify({ componentId: id, componentName: name })
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div draggable onDragStart={handleDragStart}>
      {name}
    </div>
  )
}
```
