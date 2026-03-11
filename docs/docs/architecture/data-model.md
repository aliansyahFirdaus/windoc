# Data Model

## Document Structure

```typescript
IEditorData {
  header?: IElement[]    // rendered at top of each page
  main: IElement[]       // document body
  footer?: IElement[]    // rendered at bottom of each page
  graffiti?: IGraffitiData[]  // annotations/drawings
}
```

`IElement` is the building block. Every piece of content is an `IElement`:

```typescript
{
  type?: ElementType   // TEXT, TABLE, IMAGE, TITLE, LIST, HYPERLINK, CONTROL, etc. (optional — defaults to TEXT)
  value?: string       // text content or image URL
  // ... styling props: bold, italic, size, color, font, etc.
  // ... type-specific props: trList (table), valueList (title/list), url (hyperlink), etc.
}
```

## ZERO Element (`\u200B`)

**The most important internal implementation detail.**

`ZERO` is a zero-width space character (`\u200B`) used as an **anchor element** — an invisible placeholder that always exists at the start of every element list (header, main, footer).

### Why it exists

Canvas rendering requires cursor positioning before the first visible element. Without an initial anchor, the cursor has nowhere to go before the first character.

### Lifecycle

```
formatElementList()
    → unshift({ type: TEXT, value: ZERO }) at start of list
    → ZERO lives in memory for the editor's lifetime

getValue() → zipElementList()
    → ZERO is stripped from output (user never sees it)
```

`zipElementList()` strips it explicitly:
```typescript
// core/src/utils/element.ts — zipElementList()
if (e === 0 && element.value === ZERO && element.type === ElementType.TEXT) {
  e++; continue;  // skip — don't include in output
}
```

## `formatElementList()` (`core/src/utils/element.ts`)

Called during constructor initialization on header, main, and footer **before data is passed to Draw**. This is required because Draw only knows how to render flat, simple elements — it does not understand nested structures like TITLE (with `valueList`), LIST, or CONTROL. `formatElementList` acts as a **pre-processor**: transforms complex nested input into a flat, per-character array that Draw can render directly.

### Key behaviors

**1. Unshift ZERO anchor**
```typescript
// Always adds ZERO TEXT element at start if:
// - isForceCompensation = true (always true from constructor), OR
// - first element is not TEXT/LIST or doesn't start with line break
elementList.unshift({ type: ElementType.TEXT, value: ZERO })
```

**2. TITLE → flatten to TEXT elements**
```typescript
// Input:
{ type: TITLE, level: 1, valueList: [{ type: TEXT, value: 'Hello' }] }

// Output: TITLE removed, children promoted with title styling applied
{ type: TEXT, value: 'Hello', level: 1, titleId: 'uuid', bold: true, size: 20 }
```
TITLE can have multiple items in `valueList` when the heading has **mixed formatting** (e.g. bold + normal text, hyperlink inside heading).

**3. LIST → flatten to TEXT elements**
Same pattern as TITLE — LIST element is removed, children promoted with `listId`, `listType`, `listStyle` applied.

**4. TABLE → assign IDs**
TABLE element stays, but all rows (`trId`) and cells (`tdId`) get UUIDs assigned. Each cell's content is recursively formatted.

**5. HYPERLINK / DATE → flatten to TEXT elements**
Expanded from `valueList` into individual TEXT elements with `hyperlinkId`/`dateId` attached.

**6. CONTROL → expand into components**
Most complex case. A single CONTROL element expands into: PREFIX + PRE_TEXT + VALUE/PLACEHOLDER + POST_TEXT + POSTFIX elements, each tagged with `controlId` and `controlComponent`.

**7. TEXT with value.length > 1 → split per character**
```typescript
// Input: { type: TEXT, value: 'Hi' }
// Output: [{ type: TEXT, value: 'H' }, { type: TEXT, value: 'i' }]
```
Canvas needs per-character elements for precise measurement and cursor positioning.

### Recursive calls

`formatElementList` calls itself recursively for nested content (TITLE's valueList, TABLE cell contents, CONTROL values, etc.).

## `deepClone` & `mergeOption`

- **`deepClone(data)`** — called on user input in constructor. Ensures editor mutations never affect the user's original data object.
- **`mergeOption(options)`** — merges user options with full defaults. Guarantees no `undefined` properties reach the renderer.

## `getValue()` Output

`editor.command.getValue()` returns a clean serialized document:

```
Draw.getValue()
    → zipElementList(main)   ← strips ZERO, re-zips flattened elements back into nested structures
    → return { version, data: { header, main, footer, graffiti }, options }
```

`zipElementList` is the **inverse** of `formatElementList` — it re-nests TEXT elements back into TITLE, LIST, HYPERLINK, etc. structures.
