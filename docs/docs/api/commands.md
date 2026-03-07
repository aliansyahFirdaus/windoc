---
sidebar_position: 4
---

# Commands

The command API provides programmatic control over the editor. Access it via `editor.command` from the `onReady` callback or `useEditor()` hook.

## Content

| Command | Description |
|---------|-------------|
| `getValue()` | Returns the full document data |
| `executeSetValue(data)` | Sets the full document content |
| `executeSetHTML({ main })` | Sets content from HTML string |
| `getWordCount()` | Returns word count (async) |

```typescript
// Save
const data = editor.command.getValue()
const json = JSON.stringify(data)

// Load
editor.command.executeSetValue(JSON.parse(json))
```

## Text Formatting

| Command | Description |
|---------|-------------|
| `executeBold()` | Toggle bold |
| `executeItalic()` | Toggle italic |
| `executeUnderline()` | Toggle underline |
| `executeStrikeout()` | Toggle strikethrough |
| `executeColor(color)` | Set text color |
| `executeHighlight(color)` | Set highlight color |
| `executeFont(family)` | Set font family |
| `executeSize(size)` | Set font size |
| `executeSizeAdd()` | Increase font size |
| `executeSizeMinus()` | Decrease font size |
| `executeSuperscript()` | Toggle superscript |
| `executeSubscript()` | Toggle subscript |

## Paragraph

| Command | Description |
|---------|-------------|
| `executeRowFlex('left')` | Align left |
| `executeRowFlex('center')` | Align center |
| `executeRowFlex('right')` | Align right |
| `executeRowFlex('alignment')` | Justify |
| `executeTitle(level)` | Set heading level |
| `executeListStyle(type)` | Set list style |
| `executeRowMargin(margin)` | Set line height |

## Insert

| Command | Description |
|---------|-------------|
| `executeInsertElementList(elements)` | Insert elements at cursor |
| `executeInsertTable(rows, cols)` | Insert a table |
| `executeInsertImage(src, w, h)` | Insert an image |

## Table Operations

| Command | Description |
|---------|-------------|
| `executeInsertTableTopRow()` | Insert row above |
| `executeInsertTableBottomRow()` | Insert row below |
| `executeInsertTableLeftCol()` | Insert column left |
| `executeInsertTableRightCol()` | Insert column right |
| `executeDeleteTableRow()` | Delete current row |
| `executeDeleteTableCol()` | Delete current column |
| `executeDeleteTable()` | Delete entire table |
| `executeMergeTableCell()` | Merge selected cells |
| `executeCancelMergeTableCell()` | Unmerge cells |

## History

| Command | Description |
|---------|-------------|
| `executeUndo()` | Undo last action |
| `executeRedo()` | Redo last undone action |

## Page & View

| Command | Description |
|---------|-------------|
| `executePrint()` | Print the document |
| `executePageScaleAdd()` | Zoom in |
| `executePageScaleMinus()` | Zoom out |
| `executePageScaleRecovery()` | Reset zoom to 100% |
| `executeUpdateOptions(opts)` | Update editor options |

## Selection

| Command | Description |
|---------|-------------|
| `getRangeContext()` | Get current selection context (row, col, etc.) |
