<div align="center">
  <img src="https://raw.githubusercontent.com/aliansyahFirdaus/windoc/main/docs/static/img/og.png" alt="Windoc — Canvas document editor for the web" width="720">
</div>

# @windoc/react

React bindings for the [Windoc](https://www.npmjs.com/package/@windoc/core) canvas-based document editor. Provides a ready-to-use `<Editor />` component with a built-in toolbar, footer, and fully composable architecture.

## Installation

```bash
yarn add @windoc/react @windoc/core
# or
npm install @windoc/react @windoc/core
```

### Peer Dependencies

```json
{
  "react": ">=18",
  "react-dom": ">=18",
  "lucide-react": ">=0.300.0"
}
```

## Quick Start

```tsx
import { Editor } from '@windoc/react'
import '@windoc/core/style.css'
import '@windoc/react/style.css'

export default function App() {
  return (
    <Editor
      defaultValue={{ main: [{ value: 'Hello, Windoc!' }] }}
      options={{
        margins: [40, 40, 40, 40],
        placeholder: { data: 'Start typing...' },
      }}
      onReady={(editor) => console.log('Editor ready:', editor)}
      onChange={(data) => console.log('Content changed:', data)}
      className="editor"
      style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultValue` | `EditorData` | `{ main: [] }` | Initial document data |
| `options` | `EditorOptions` | `{}` | Editor configuration |
| `onChange` | `(data: object) => void` | — | Content change callback |
| `onReady` | `(editor: EditorInstance) => void` | — | Editor ready callback |
| `toolbar` | `boolean` | `true` | Show built-in toolbar |
| `footer` | `boolean` | `true` | Show built-in footer/statusbar |
| `renderToolbar` | `ReactNode` | — | Custom toolbar replacement |
| `renderFooter` | `ReactNode` | — | Custom footer replacement |
| `children` | `ReactNode` | — | Extra content inside EditorProvider |
| `className` | `string` | `'editor'` | CSS class for editor container |
| `style` | `CSSProperties` | — | Inline style for editor container |
| `onDrop` | `(e, editor) => void` | — | Drag-and-drop handler |

## Composable Architecture

Build your own toolbar or footer by composing individual tool components:

### Custom Toolbar

```tsx
import {
  Editor,
  EditorProvider,
  UndoTool, RedoTool,
  BoldTool, ItalicTool, UnderlineTool,
  FontTool, FontSizeTool,
  LeftAlignTool, CenterAlignTool, RightAlignTool,
  TableTool, ImageTool,
} from '@windoc/react'

function MyToolbar() {
  return (
    <div className="my-toolbar">
      <UndoTool />
      <RedoTool />
      <BoldTool />
      <ItalicTool />
      <UnderlineTool />
      <FontTool />
      <FontSizeTool />
      <LeftAlignTool />
      <CenterAlignTool />
      <RightAlignTool />
      <TableTool />
      <ImageTool />
    </div>
  )
}

export default function App() {
  return (
    <Editor
      toolbar={false}
      renderToolbar={<MyToolbar />}
    />
  )
}
```

### Available Toolbar Tools

| Component | Description |
|-----------|-------------|
| `UndoTool` | Undo last action |
| `RedoTool` | Redo last action |
| `BoldTool` | Toggle bold |
| `ItalicTool` | Toggle italic |
| `UnderlineTool` | Toggle underline |
| `StrikeoutTool` | Toggle strikethrough |
| `ColorTool` | Text color picker |
| `HighlightTool` | Background highlight picker |
| `FontTool` | Font family selector |
| `FontSizeTool` | Font size selector |
| `TitleTool` | Heading level selector |
| `LineHeightTool` | Line height selector |
| `LeftAlignTool` | Align left |
| `CenterAlignTool` | Align center |
| `RightAlignTool` | Align right |
| `JustifyTool` | Justify text |
| `ListTool` | Ordered/unordered lists |
| `TableTool` | Insert table |
| `ImageTool` | Insert image |
| `ColumnTool` | Column layout |
| `SeparatorTool` | Horizontal separator |
| `PageBreakTool` | Page break |
| `WatermarkTool` | Watermark settings |

### Available Footer Tools

| Component | Description |
|-----------|-------------|
| `CatalogToggleTool` | Toggle document catalog/outline |
| `PageModeTool` | Switch page mode |
| `FooterStatus` | Page/word count status |
| `EditorModeTool` | Switch editor mode |
| `PageScaleMinusTool` | Zoom out |
| `PageScalePercentageTool` | Zoom percentage display |
| `PageScaleAddTool` | Zoom in |
| `PaperSizeTool` | Paper size selector |
| `PaperDirectionTool` | Paper orientation |
| `PaperMarginTool` | Paper margin settings |
| `FullscreenTool` | Toggle fullscreen |
| `EditorOptionTool` | Editor options |
| `WatermarkFooterTool` | Watermark toggle |

## Hooks

### `useEditor()`

Access the editor instance and selection state from any child component:

```tsx
import { useEditor } from '@windoc/react'

function MyComponent() {
  const { editorRef, rangeStyle } = useEditor()

  const handleClick = () => {
    editorRef.current?.command.executeBold()
  }

  return (
    <button
      onClick={handleClick}
      className={rangeStyle?.bold ? 'active' : ''}
    >
      Bold
    </button>
  )
}
```

### `useFooter()`

Access page/document metadata:

```tsx
import { useFooter } from '@windoc/react'

function StatusBar() {
  const { pageNo, pageSize, wordCount, pageScale } = useFooter()

  return (
    <div>
      Page {pageNo} of {pageSize} | {wordCount} words | {pageScale}%
    </div>
  )
}
```

## Types

```typescript
import type { EditorInstance, RangeStylePayload, ICatalogItem, IComment } from '@windoc/react'
```

## License

MIT
