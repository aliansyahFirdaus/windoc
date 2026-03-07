---
sidebar_position: 2
---

# Custom Footer

The footer (status bar) at the bottom of the editor shows page info, zoom controls, and paper settings. Like the toolbar, every footer component is individually exported.

## Using Individual Footer Tools

```tsx
import {
  Editor,
  FooterStatus,
  PageScaleMinusTool, PageScalePercentageTool, PageScaleAddTool,
  PaperSizeTool, PaperDirectionTool,
  FullscreenTool,
} from '@windoc/react'

function MyFooter() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', borderTop: '1px solid #e5e7eb' }}>
      <FooterStatus />
      <div style={{ display: 'flex', gap: 4 }}>
        <PageScaleMinusTool />
        <PageScalePercentageTool />
        <PageScaleAddTool />
        <PaperSizeTool />
        <PaperDirectionTool />
        <FullscreenTool />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Editor footer={false} renderFooter={<MyFooter />} />
  )
}
```

## Available Footer Tools

| Component | Description |
|-----------|-------------|
| `CatalogToggleTool` | Toggle document outline |
| `PageModeTool` | Switch page display mode |
| `FooterStatus` | Page/word count status display |
| `EditorModeTool` | Switch editor mode (edit/readonly) |
| `PageScaleMinusTool` | Zoom out |
| `PageScalePercentageTool` | Current zoom percentage |
| `PageScaleAddTool` | Zoom in |
| `PaperSizeTool` | Paper size selector (A4, Letter, etc.) |
| `PaperDirectionTool` | Paper orientation (portrait/landscape) |
| `PaperMarginTool` | Paper margin settings |
| `FullscreenTool` | Toggle fullscreen mode |
| `EditorOptionTool` | Editor options panel |
| `WatermarkFooterTool` | Watermark toggle |

## Using the `useFooter` Hook

Build completely custom status displays:

```tsx
import { useFooter } from '@windoc/react'

function MyStatus() {
  const { pageNo, pageSize, wordCount, pageScale } = useFooter()

  return (
    <span>
      Page {pageNo}/{pageSize} | {wordCount} words | {pageScale}%
    </span>
  )
}
```
