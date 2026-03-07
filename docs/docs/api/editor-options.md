---
sidebar_position: 3
---

# Editor Options

Configuration options passed to the `<Editor />` component's `options` prop or the core `Editor` constructor.

## Usage

```tsx
<Editor
  options={{
    margins: [40, 40, 40, 40],
    watermark: { data: 'DRAFT', size: 120 },
    header: { top: 13 },
    footer: { bottom: 0, backgroundColor: '#0c718d' },
    pageNumber: {
      disabled: false,
      format: '{pageNo} of {pageCount}',
      size: 10,
    },
    placeholder: { data: 'Start typing...' },
    zone: { tipDisabled: false },
    maskMargin: [60, 0, 30, 0],
    scrollContainerSelector: '.editor',
  }}
/>
```

## Options Reference

### `margins`

Page margins in pixels: `[top, right, bottom, left]`.

```typescript
margins: [40, 40, 40, 40]
```

### `watermark`

Text watermark configuration.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `string` | `''` | Watermark text (empty = no watermark) |
| `size` | `number` | `120` | Font size |
| `color` | `string` | — | Text color |
| `opacity` | `number` | — | Opacity (0-1) |

### `header`

Header zone configuration.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `top` | `number` | — | Top offset in pixels |
| `disabled` | `boolean` | `false` | Disable header zone |

### `footer`

Footer zone configuration.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `bottom` | `number` | — | Bottom offset in pixels |
| `disabled` | `boolean` | `false` | Disable footer zone |
| `backgroundColor` | `string` | — | Footer background color |

### `pageNumber`

Page number configuration.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `disabled` | `boolean` | `false` | Disable page numbers |
| `format` | `string` | `'{pageNo}'` | Format string. Use `{pageNo}` and `{pageCount}` |
| `color` | `string` | — | Text color |
| `font` | `string` | — | Font family |
| `size` | `number` | — | Font size |
| `rowFlex` | `string` | — | Alignment: `'left'`, `'center'`, `'right'` |
| `bottom` | `number` | — | Bottom offset |

### `placeholder`

Editor placeholder text.

| Property | Type | Description |
|----------|------|-------------|
| `data` | `string` | Placeholder text shown when editor is empty |

### `zone`

Zone (header/body/footer sections) settings.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tipDisabled` | `boolean` | `false` | Disable zone tip labels |

### `maskMargin`

Margin for the page mask area: `[top, right, bottom, left]`. Controls the visible area around pages.

```typescript
maskMargin: [60, 0, 30, 0]
```

### `scrollContainerSelector`

CSS selector for the scroll container. Used when the editor is nested inside a custom scroll container.

```typescript
scrollContainerSelector: '.editor'
```

### `defaultBasicRowMarginHeight`

Default spacing between rows in pixels.

```typescript
defaultBasicRowMarginHeight: 5
```

## Updating Options at Runtime

Use the command API to update options after initialization:

```typescript
editor.command.executeUpdateOptions({
  watermark: { data: 'CONFIDENTIAL', size: 100 },
})
```
