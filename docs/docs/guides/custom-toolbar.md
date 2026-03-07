---
sidebar_position: 1
---

# Custom Toolbar

Windoc's React package exports every toolbar tool as an individual component. You can compose your own toolbar with exactly the tools you need.

## Using Individual Tools

```tsx
import {
  Editor,
  UndoTool, RedoTool,
  BoldTool, ItalicTool, UnderlineTool,
  FontTool, FontSizeTool,
  LeftAlignTool, CenterAlignTool, RightAlignTool,
  TableTool, ImageTool,
} from '@windoc/react'

function MyToolbar() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: 8, borderBottom: '1px solid #e5e7eb' }}>
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
    <Editor toolbar={false} renderToolbar={<MyToolbar />} />
  )
}
```

## Available Tools

| Component | Description |
|-----------|-------------|
| `UndoTool` | Undo last action |
| `RedoTool` | Redo last action |
| `BoldTool` | Toggle bold |
| `ItalicTool` | Toggle italic |
| `UnderlineTool` | Toggle underline |
| `StrikeoutTool` | Toggle strikethrough |
| `ColorTool` | Text color picker |
| `HighlightTool` | Background highlight |
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

## Building Fully Custom Tools

Use the `useEditor` hook to access the editor instance and build any custom tool:

```tsx
import { useEditor } from '@windoc/react'

function PrintButton() {
  const { editorRef } = useEditor()

  return (
    <button onClick={() => editorRef.current?.command.executePrint()}>
      Print
    </button>
  )
}
```

The `useEditor` hook also gives you `rangeStyle` — the current selection's style state — so you can show active states:

```tsx
function MyBoldButton() {
  const { editorRef, rangeStyle } = useEditor()

  return (
    <button
      onClick={() => editorRef.current?.command.executeBold()}
      style={{ fontWeight: rangeStyle?.bold ? 'bold' : 'normal' }}
    >
      B
    </button>
  )
}
```
