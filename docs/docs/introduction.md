---
sidebar_position: 1
slug: /
---

# Introduction

**Windoc** is a canvas-based document editor for the web. It renders documents using HTML5 Canvas with pixel-perfect pagination, rich text formatting, tables, images, and print support.

## Why Windoc?

Unlike DOM-based editors (ProseMirror, Tiptap, Quill), Windoc renders everything on a Canvas element. This gives you:

- **Pixel-perfect rendering** — What you see is exactly what you print
- **True pagination** — Real page breaks, not simulated ones
- **High performance** — Canvas rendering is faster for complex documents
- **Print fidelity** — Native print output matches the editor exactly

## Packages

| Package | Description |
|---------|-------------|
| `@windoc/core` | The canvas editor engine. Framework-agnostic. |
| `@windoc/react` | React bindings with composable toolbar & footer components. |

## Quick Example

```tsx
import { Editor } from '@windoc/react'
import '@windoc/core/style.css'
import '@windoc/react/style.css'

function App() {
  return (
    <Editor
      defaultValue={{ main: [{ value: 'Hello, Windoc!' }] }}
      options={{
        margins: [40, 40, 40, 40],
        placeholder: { data: 'Start typing...' },
      }}
    />
  )
}
```

This renders a full document editor with toolbar, canvas editing area, and status bar — all out of the box.
