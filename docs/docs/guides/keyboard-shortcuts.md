---
sidebar_position: 4
---

# Keyboard Shortcuts

Windoc supports registering custom keyboard shortcuts via the editor instance.

## Registering Shortcuts

Use `editor.register.shortcutList()` after the editor is ready:

```tsx
import { Editor } from '@windoc/react'

function App() {
  return (
    <Editor
      onReady={(editor) => {
        const { KeyMap } = require('@windoc/core')

        editor.register.shortcutList([
          {
            key: KeyMap.P,
            mod: true,        // Cmd on Mac, Ctrl on Windows
            isGlobal: true,
            callback: (command) => {
              command.executePrint()
            },
          },
          {
            key: KeyMap.MINUS,
            ctrl: true,
            isGlobal: true,
            callback: (command) => {
              command.executePageScaleMinus()
            },
          },
          {
            key: KeyMap.EQUAL,
            ctrl: true,
            isGlobal: true,
            callback: (command) => {
              command.executePageScaleAdd()
            },
          },
        ])
      }}
    />
  )
}
```

## Shortcut Options

| Property | Type | Description |
|----------|------|-------------|
| `key` | `KeyMap` | The key to bind |
| `mod` | `boolean` | Cmd (Mac) / Ctrl (Windows) |
| `ctrl` | `boolean` | Ctrl key specifically |
| `shift` | `boolean` | Shift key |
| `alt` | `boolean` | Alt/Option key |
| `isGlobal` | `boolean` | Whether shortcut works outside editor focus |
| `callback` | `(command) => void` | Handler receiving the command API |

## Built-in Shortcuts

The editor comes with these shortcuts out of the box:

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + U` | Underline |
| `Ctrl/Cmd + C` | Copy |
| `Ctrl/Cmd + V` | Paste |
| `Ctrl/Cmd + X` | Cut |
| `Ctrl/Cmd + A` | Select all |
| `Tab` | Indent / next cell |
| `Shift + Tab` | Outdent / previous cell |
