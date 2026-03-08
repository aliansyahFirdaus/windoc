<div align="center">
  <img src="https://raw.githubusercontent.com/aliansyahFirdaus/windoc/main/docs/static/img/logo-text-white.png#gh-light-mode-only" alt="Windoc" height="120">
  <img src="https://raw.githubusercontent.com/aliansyahFirdaus/windoc/main/docs/static/img/logo-text-black.png#gh-dark-mode-only" alt="Windoc" height="120">
</div>

## Windoc

Canvas-based document editor for the web. High-performance rendering via HTML5 Canvas with pixel-perfect pagination, rich text formatting, tables, images, and print support.

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [@windoc/core](./core) | Canvas editor engine | 0.2.0 |
| [@windoc/react](./react) | React bindings & composable UI | 0.2.0 |

## Getting Started

```bash
npm install @windoc/core @windoc/react
```

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
      onReady={(editor) => console.log('Ready!', editor)}
    />
  )
}
```

## Features

- **Canvas Rendering** — Pixel-perfect document rendering via HTML5 Canvas
- **Pagination** — Automatic page breaking with configurable sizes (A4, Letter, etc.)
- **Rich Text** — Bold, italic, underline, strikeout, color, highlight, fonts
- **Tables** — Merge/split cells, borders, row/column operations
- **Images** — Inline images with resize, rotate, alignment
- **Headers & Footers** — Per-page headers, footers, page numbers
- **Watermarks** — Configurable text watermarks
- **Lists** — Ordered and unordered lists
- **Print** — Native print with accurate pagination
- **Composable UI** — Mix and match toolbar/footer components or build your own
- **Extensible** — Plugins, custom shortcuts, custom context menus

## Development

```bash
yarn install
yarn build
```

## Contributing

Contributions are welcome! Please read the [Contributing Guide](./CONTRIBUTING.md) before opening a pull request.

## License

MIT
