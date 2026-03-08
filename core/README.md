<div align="center">
  <img src="https://raw.githubusercontent.com/aliansyahFirdaus/windoc/main/docs/static/img/logo-text-white.png#gh-light-mode-only" alt="Windoc" height="120">
  <img src="https://raw.githubusercontent.com/aliansyahFirdaus/windoc/main/docs/static/img/logo-text-black.png#gh-dark-mode-only" alt="Windoc" height="120">
</div>

# @windoc/core

Canvas-based document editor engine for the web. Renders documents using HTML5 Canvas with pixel-perfect pagination, headers, footers, watermarks, and print support.

## Installation

```bash
yarn add @windoc/core
# or
npm install @windoc/core
```

## Usage

```typescript
import Editor from '@windoc/core'
import '@windoc/core/style.css'

const container = document.getElementById('editor')

const editor = new Editor(container, {
  main: [
    { value: 'Hello, Windoc!' }
  ]
}, {
  margins: [40, 40, 40, 40],
  watermark: { data: '', size: 120 },
  placeholder: { data: 'Start typing...' },
})
```

## Features

- **Canvas Rendering** — High-performance rendering via HTML5 Canvas
- **Pagination** — Automatic page breaking with configurable page sizes (A4, Letter, etc.)
- **Rich Text** — Bold, italic, underline, strikeout, color, highlight, fonts, font sizes
- **Tables** — Full table support with merge/split cells, borders, row/column operations
- **Images** — Inline images with resize, rotate, and alignment
- **Headers & Footers** — Per-page headers, footers, and page numbers
- **Watermarks** — Configurable text watermarks
- **Lists** — Ordered and unordered lists
- **Zones** — Document zones (header, body, footer) with visual tips
- **History** — Undo/redo with full state management
- **Keyboard Shortcuts** — Customizable shortcut registration
- **Context Menus** — Extensible right-click context menus
- **Print** — Native print support with accurate pagination
- **i18n** — Built-in internationalization (English, Chinese)
- **Plugins** — Plugin architecture for extensibility
- **Commands** — Comprehensive command API for programmatic control

## API

### Constructor

```typescript
new Editor(container: HTMLElement, data: EditorData, options?: EditorOptions)
```

### EditorData

```typescript
interface EditorData {
  header?: IElement[]   // Header elements
  main: IElement[]      // Body content elements
  footer?: IElement[]   // Footer elements
}
```

### Key Options

| Option | Type | Description |
|--------|------|-------------|
| `margins` | `number[]` | Page margins `[top, right, bottom, left]` |
| `watermark` | `object` | Watermark config `{ data, size, color, opacity }` |
| `header` | `object` | Header config `{ top, disabled }` |
| `footer` | `object` | Footer config `{ bottom, disabled, backgroundColor }` |
| `pageNumber` | `object` | Page number config `{ disabled, format, color, font, size }` |
| `placeholder` | `object` | Placeholder text `{ data }` |
| `zone` | `object` | Zone settings `{ tipDisabled }` |
| `maskMargin` | `number[]` | Mask margin around pages |

### Commands

Access via `editor.command`:

```typescript
editor.command.executeSetValue(data)       // Set document content
editor.command.getValue()                  // Get document data
editor.command.executePrint()              // Print document
editor.command.executeUndo()               // Undo
editor.command.executeRedo()               // Redo
editor.command.executeBold()               // Toggle bold
editor.command.executeItalic()             // Toggle italic
editor.command.executeInsertTable(rows, cols) // Insert table
editor.command.getWordCount()              // Get word count (async)
```

### Listeners

```typescript
editor.listener.rangeStyleChange = (payload) => { /* selection style changed */ }
editor.listener.contentChange = () => { /* content changed */ }
editor.listener.pageSizeChange = (count) => { /* page count changed */ }
editor.listener.intersectionPageNoChange = (pageNo) => { /* visible page changed */ }
editor.listener.pageScaleChange = (scale) => { /* zoom level changed */ }
```

### Shortcuts

```typescript
editor.register.shortcutList([
  { key: KeyMap.P, mod: true, isGlobal: true, callback: (cmd) => cmd.executePrint() },
])
```

### Context Menus

```typescript
editor.register.contextMenuList([
  {
    name: 'My Action',
    icon: 'custom-icon',
    when: (payload) => !payload.isReadonly,
    callback: (command) => { /* do something */ },
  },
])
```

## License

MIT
