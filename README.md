<div align="center">
  <img src="https://raw.githubusercontent.com/aliansyahFirdaus/windoc/main/docs/static/img/logo-text-white.png#gh-light-mode-only" alt="Windoc" height="120">
  <img src="https://raw.githubusercontent.com/aliansyahFirdaus/windoc/main/docs/static/img/logo-text-black.png#gh-dark-mode-only" alt="Windoc" height="120">

  <br />
  <br />

  [![npm](https://img.shields.io/npm/v/@windoc/core?label=%40windoc%2Fcore&color=0D746B)](https://www.npmjs.com/package/@windoc/core)
  [![npm](https://img.shields.io/npm/v/@windoc/react?label=%40windoc%2Freact&color=0D746B)](https://www.npmjs.com/package/@windoc/react)
  [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
  [![CI](https://github.com/aliansyahFirdaus/windoc/actions/workflows/ci.yml/badge.svg)](https://github.com/aliansyahFirdaus/windoc/actions/workflows/ci.yml)
</div>

# Windoc

Canvas-based document editor for the web. High-performance rendering via HTML5 Canvas with pixel-perfect pagination, rich text formatting, tables, images, and print support.

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [@windoc/core](./core) | Canvas editor engine | 0.2.1 |
| [@windoc/react](./react) | React bindings & composable UI | 0.2.1 |

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
