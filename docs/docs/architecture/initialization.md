# Editor Initialization

## Overview

Windoc is a **canvas-based** document editor. Unlike DOM-based editors (e.g. Google Docs which uses `contenteditable`), Windoc draws everything manually onto an HTML `<canvas>` element. This gives full control over page layout (A4 pages, margins, headers/footers) at the cost of having to implement selection, cursor, and text input manually.

## React Wrapper Flow

When using `@windoc/react`, the user never calls `new Editor()` directly. The `<Editor>` React component handles it internally:

```tsx
// User code
<Editor defaultValue={data} options={options} onChange={handleChange} />

// Internally (Editor.tsx)
useEffect(() => {
  const { default: EditorClass } = await import('@windoc/core')  // dynamic import (SSR-safe)
  const instance = new EditorClass(containerRef.current, data, options)
  editorRef.current = instance
}, [])  // runs once on mount
```

The `containerRef` is a `<div>` created internally — user does not need to pass a container when using the React wrapper.

## Constructor (`core/src/index.ts`)

`new Editor(container, data, options)` accepts 3 arguments:

| Arg | Type | Description |
|-----|------|-------------|
| `container` | `HTMLDivElement` | DOM element where canvas will be mounted |
| `data` | `IEditorData \| IElement[]` | Initial document content |
| `options` | `IEditorOption` | Editor configuration (margins, locale, watermark, etc.) |

### Constructor Steps

```
1. mergeOption(options)         → merge user options with defaults (core/src/utils/option.ts)
2. deepClone(data)              → clone input data so user's original is never mutated
3. normalize data               → split into { header, main, footer, graffiti }
4. formatElementList()          → validate & expand each section (see data-model.md)
5. new Listener()               → public callback hooks for users
6. new EventBus()               → internal typed event system
7. new Override()               → optional behavior overrides (paste, copy, drop)
8. new Draw()                   → THE MAIN SYSTEM: creates canvas, starts RAF loop, setup events
9. new Command(CommandAdapt)    → public mutation API (editor.command.executeBold(), etc.)
10. new ContextMenu()           → right-click menu
11. new Shortcut()              → keyboard shortcuts
12. new Register()              → lets users register custom shortcuts & context menus
13. new Plugin()                → plugin system (editor.use(plugin))
```

### Default Options (`core/src/utils/option.ts`)

Key defaults:
- `locale: 'en'` — English (supported: `'en'`, `'id'`)
- `mode: EditorMode.EDIT`
- `width: 794, height: 1123` — A4 size in px
- `margins: [96, 96, 96, 96]`
- `defaultFont: 'Arial'`, `defaultSize: 11`

## Public API Surface

After construction, the `Editor` instance exposes:

```typescript
editor.command    // Trigger mutations: executeBold(), executeInsertTable(), getValue(), etc.
editor.listener   // Assign callbacks: contentChange, rangeStyleChange, pageSizeChange, etc.
editor.eventBus   // Internal event bus (also accessible for advanced use)
editor.override   // Override default paste/copy/drop behavior
editor.register   // Register custom shortcuts and context menus
editor.use()      // Install plugins
editor.destroy()  // Cleanup: stop RAF, remove event listeners, clear eventBus
editor.version    // Current version string (synced from package.json via yarn sync-version)
```
