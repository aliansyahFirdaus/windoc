# Changelog

All notable changes to this project will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [0.2.0] — 2025

### Added
- `@windoc/react` package — React bindings with composable toolbar and footer components
- `useEditor()` hook — access editor instance and selection state
- `useFooter()` hook — access page/document metadata
- `EditorProvider` context for sharing editor state across components
- Full set of composable toolbar tools: `UndoTool`, `RedoTool`, `BoldTool`, `ItalicTool`, `UnderlineTool`, `StrikeoutTool`, `ColorTool`, `HighlightTool`, `FontTool`, `FontSizeTool`, `TitleTool`, `LineHeightTool`, alignment tools, `ListTool`, `TableTool`, `ImageTool`, `ColumnTool`, `SeparatorTool`, `PageBreakTool`, `WatermarkTool`
- Full set of composable footer tools: `CatalogToggleTool`, `PageModeTool`, `FooterStatus`, `EditorModeTool`, zoom tools, `PaperSizeTool`, `PaperDirectionTool`, `PaperMarginTool`, `FullscreenTool`, `WatermarkFooterTool`
- `onDrop` prop for drag-and-drop support
- Watermark support via `WatermarkTool` and `WatermarkFooterTool`

### Changed
- Improved canvas rendering performance
- Better TypeScript types across public API

---

## [0.1.0] — 2024

### Added
- Initial release of `@windoc/core`
- Canvas-based document rendering via HTML5 Canvas
- Rich text: bold, italic, underline, strikethrough, color, highlight, fonts, sizes
- True pagination with configurable paper sizes (A4, Letter, etc.)
- Table support: insert, merge/split cells, row/column operations
- Image support: inline images with resize, rotate, alignment
- Headers and footers with page numbers
- Watermarks
- Ordered and unordered lists
- Undo/redo history
- Keyboard shortcut registration
- Extensible context menus
- Native print support
- Plugin architecture
- Built-in i18n (English, Chinese)
