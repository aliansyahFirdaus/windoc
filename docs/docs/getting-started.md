---
sidebar_position: 2
---

# Getting Started

## Installation

```bash
npm install @windoc/core @windoc/react
```

```bash
yarn add @windoc/core @windoc/react
```

### Peer Dependencies

Make sure you have the following peer dependencies installed:

```bash
npm install react react-dom lucide-react
```

## Basic Usage

```tsx
'use client'

import { Editor } from '@windoc/react'
import '@windoc/core/style.css'
import '@windoc/react/style.css'

export default function MyEditor() {
  return (
    <Editor
      defaultValue={{
        main: [{ value: 'Start writing here...' }],
      }}
      options={{
        margins: [40, 40, 40, 40],
        placeholder: { data: 'Enter text...' },
        watermark: { data: '', size: 120 },
      }}
      onReady={(editor) => {
        console.log('Editor is ready:', editor)
      }}
      onChange={(data) => {
        console.log('Content changed:', data)
      }}
      className="editor"
      style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
    />
  )
}
```

## With Next.js

Since Windoc uses Canvas and browser APIs, it must be rendered client-side. Use the `'use client'` directive in Next.js App Router:

```tsx
'use client'

import { Editor } from '@windoc/react'
import '@windoc/core/style.css'
import '@windoc/react/style.css'

export default function EditorPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Editor
        defaultValue={{ main: [] }}
        options={{
          margins: [40, 40, 40, 40],
          scrollContainerSelector: '.editor',
        }}
        className="editor"
        style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
      />
    </div>
  )
}
```

## Getting the Editor Instance

The `onReady` callback gives you the `EditorInstance` which provides full access to the editor API:

```tsx
import type { EditorInstance } from '@windoc/react'
import { useRef } from 'react'

function MyEditor() {
  const editorRef = useRef<EditorInstance | null>(null)

  const handleSave = () => {
    const data = editorRef.current?.command.getValue()
    console.log('Document data:', JSON.stringify(data))
  }

  return (
    <>
      <button onClick={handleSave}>Save</button>
      <Editor
        onReady={(editor) => { editorRef.current = editor }}
        defaultValue={{ main: [] }}
      />
    </>
  )
}
```

## Hiding Built-in UI

You can hide the built-in toolbar and/or footer:

```tsx
<Editor toolbar={false} footer={false} />
```

Or replace them with your own:

```tsx
<Editor
  toolbar={false}
  renderToolbar={<MyCustomToolbar />}
  footer={false}
  renderFooter={<MyCustomFooter />}
/>
```
