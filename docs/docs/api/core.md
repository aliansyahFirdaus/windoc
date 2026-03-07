---
sidebar_position: 1
---

# @windoc/core

The canvas editor engine. This is the framework-agnostic core that handles all document rendering, editing, and management.

## Installation

```bash
npm install @windoc/core
```

## Constructor

```typescript
import Editor from '@windoc/core'
import '@windoc/core/style.css'

const editor = new Editor(container, data, options)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | `HTMLElement` | DOM element to mount the editor |
| `data` | `EditorData` | Initial document data |
| `options` | `EditorOptions` | Editor configuration (optional) |

### EditorData

```typescript
interface EditorData {
  header?: IElement[]   // Header elements
  main: IElement[]      // Body content
  footer?: IElement[]   // Footer elements
}
```

### IElement

```typescript
interface IElement {
  value?: string
  type?: ElementType
  size?: number
  font?: string
  color?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikeout?: boolean
  width?: number
  height?: number
  // ... and more
}
```

## Lifecycle

```typescript
// Create
const editor = new Editor(container, data, options)

// Destroy
editor.destroy()
```

## editor.command

The command API for programmatic control.

### Content

```typescript
editor.command.executeSetValue(data)       // Set full document content
editor.command.getValue()                  // Get full document data
editor.command.executeSetHTML({ main: html }) // Set content from HTML
editor.command.getWordCount()              // Get word count (async)
```

### Text Formatting

```typescript
editor.command.executeBold()
editor.command.executeItalic()
editor.command.executeUnderline()
editor.command.executeStrikeout()
editor.command.executeColor(color)         // e.g. '#ff0000'
editor.command.executeHighlight(color)
editor.command.executeFont(fontFamily)
editor.command.executeSizeAdd()
editor.command.executeSizeMinus()
editor.command.executeSize(size)           // e.g. 16
```

### Paragraph

```typescript
editor.command.executeRowFlex('left')
editor.command.executeRowFlex('center')
editor.command.executeRowFlex('right')
editor.command.executeRowFlex('alignment') // justify
editor.command.executeTitle(level)         // null, 'first', 'second', etc.
editor.command.executeListStyle(type)      // list style
editor.command.executeRowMargin(margin)    // line height
```

### Insert

```typescript
editor.command.executeInsertTable(rows, cols)
editor.command.executeInsertElementList(elements)
editor.command.executeInsertImage(src, width, height)
```

### Table

```typescript
editor.command.executeInsertTableTopRow()
editor.command.executeInsertTableBottomRow()
editor.command.executeInsertTableLeftCol()
editor.command.executeInsertTableRightCol()
editor.command.executeDeleteTableRow()
editor.command.executeDeleteTableCol()
editor.command.executeDeleteTable()
editor.command.executeMergeTableCell()
editor.command.executeCancelMergeTableCell()
```

### Page & View

```typescript
editor.command.executePrint()
editor.command.executePageScaleAdd()
editor.command.executePageScaleMinus()
editor.command.executePageScaleRecovery()
editor.command.executeUpdateOptions(options)
```

### History

```typescript
editor.command.executeUndo()
editor.command.executeRedo()
```

### Selection

```typescript
editor.command.getRangeContext()  // Get current selection info
```

## editor.listener

Event listeners for reacting to editor state changes.

```typescript
editor.listener.rangeStyleChange = (payload: RangeStylePayload) => {}
editor.listener.contentChange = () => {}
editor.listener.pageSizeChange = (pageCount: number) => {}
editor.listener.intersectionPageNoChange = (pageNo: number) => {}
editor.listener.pageScaleChange = (scale: number) => {}
editor.listener.visiblePageNoListChange = (pageNos: number[]) => {}
```

## editor.register

Register custom shortcuts and context menus.

```typescript
// Shortcuts
editor.register.shortcutList([
  { key: KeyMap.P, mod: true, isGlobal: true, callback: (cmd) => cmd.executePrint() },
])

// Context menus
editor.register.contextMenuList([
  {
    name: 'My Action',
    icon: 'icon-name',
    when: (payload) => !payload.isReadonly,
    callback: (command) => { /* ... */ },
  },
])
```

## Exports

```typescript
import Editor, {
  KeyMap,
  EditorMode,
  EditorZone,
  ElementType,
  Dialog,
  Signature,
} from '@windoc/core'
```
