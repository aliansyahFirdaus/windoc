---
sidebar_position: 2
---

# @windoc/react

React bindings for Windoc. Provides the `<Editor />` component and composable toolbar/footer tools.

## Installation

```bash
npm install @windoc/react @windoc/core
```

### Peer Dependencies

- `react` >= 18
- `react-dom` >= 18
- `lucide-react` >= 0.300.0

## `<Editor />`

The main component that renders the full editor.

```tsx
import { Editor } from '@windoc/react'
import '@windoc/core/style.css'
import '@windoc/react/style.css'
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultValue` | `EditorData` | `{ main: [] }` | Initial document data |
| `options` | `EditorOptions` | `{}` | Editor configuration |
| `onChange` | `(data: object) => void` | — | Content change callback |
| `onReady` | `(editor: EditorInstance) => void` | — | Editor ready callback |
| `toolbar` | `boolean` | `true` | Show built-in toolbar |
| `footer` | `boolean` | `true` | Show built-in footer |
| `renderToolbar` | `ReactNode` | — | Custom toolbar replacement |
| `renderFooter` | `ReactNode` | — | Custom footer replacement |
| `children` | `ReactNode` | — | Extra content inside EditorProvider |
| `className` | `string` | `'editor'` | CSS class for editor container |
| `style` | `CSSProperties` | — | Inline style for editor container |
| `onDrop` | `(e, editor) => void` | — | Drag-and-drop handler |

## Hooks

### `useEditor()`

Access the editor instance and current selection style from any child component.

```tsx
import { useEditor } from '@windoc/react'

function MyTool() {
  const { editorRef, rangeStyle } = useEditor()

  return (
    <button onClick={() => editorRef.current?.command.executeBold()}>
      Bold: {rangeStyle?.bold ? 'ON' : 'OFF'}
    </button>
  )
}
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `editorRef` | `MutableRefObject<EditorInstance \| null>` | Ref to the editor instance |
| `rangeStyle` | `RangeStylePayload \| null` | Current selection's style state |

### `useFooter()`

Access page and document metadata.

```tsx
import { useFooter } from '@windoc/react'

function Status() {
  const { pageNo, pageSize, wordCount, pageScale } = useFooter()
  return <span>Page {pageNo}/{pageSize}</span>
}
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `pageNo` | `number` | Current page number |
| `pageSize` | `number` | Total page count |
| `wordCount` | `number` | Document word count |
| `pageScale` | `number` | Current zoom percentage |
| `pageNoList` | `string` | Visible page numbers |
| `rowNo` | `number` | Current row number |
| `colNo` | `number` | Current column number |

## Providers

### `<EditorProvider>`

Wraps components that need access to `useEditor()`. The `<Editor />` component includes this automatically.

### `<FooterProvider>`

Wraps components that need access to `useFooter()`. The `<Editor />` component includes this automatically.

## Types

```typescript
import type {
  EditorInstance,
  RangeStylePayload,
  ICatalogItem,
  IComment,
} from '@windoc/react'
```
