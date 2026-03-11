# Internal Systems

## EventBus (`core/src/core/event/eventbus/EventBus.ts`)

Typed **pub/sub** system for internal communication between editor modules.

```typescript
eventBus.on('contentChange', handler)   // subscribe
eventBus.emit('contentChange', payload) // publish
eventBus.off('contentChange', handler)  // unsubscribe
eventBus.isSubscribe('contentChange')   // check if anyone is listening
eventBus.dangerouslyClearAll()          // wipe all subscriptions (called in destroy())
```

### EventBus vs Listener

| | EventBus | Listener |
|---|---|---|
| **Audience** | Internal modules | External users |
| **Usage** | Inter-module communication | User-facing callbacks |
| **Example** | Draw emits `'input'` → Command reacts | `editor.listener.contentChange = () => {}` |

**Flow example:**
```
User types
    ↓
CanvasEvent → eventBus.emit('input')
    ↓
Draw reacts → re-renders canvas
    ↓
Draw → eventBus.emit('contentChange')
    ↓
Listener.contentChange() fires → user's onChange callback
```

### Available events (`core/src/interface/EventBus.ts`)

`rangeStyleChange`, `visiblePageNoListChange`, `intersectionPageNoChange`, `pageSizeChange`, `pageScaleChange`, `saved`, `contentChange`, `controlChange`, `controlContentChange`, `pageModeChange`, `zoneChange`, `mousemove`, `mouseleave`, `mouseenter`, `mousedown`, `mouseup`, `click`, `input`, `positionContextChange`, `imageSizeChange`, `imageMousedown`, `imageDblclick`, `labelMousedown`

---

## Listener (`core/src/core/listener/Listener.ts`)

Public callback hooks assigned directly by the user (or React wrapper):

```typescript
editor.listener.contentChange = async () => { ... }
editor.listener.rangeStyleChange = (payload) => { ... }
editor.listener.pageSizeChange = (payload) => { ... }
editor.listener.visiblePageNoListChange = (payload) => { ... }
editor.listener.intersectionPageNoChange = (payload) => { ... }
editor.listener.pageScaleChange = (payload) => { ... }
```

In `@windoc/react`, these are wired automatically from props (`onChange`, `onRangeStyleChange`, etc.) inside `useEffect`.

---

## Override (`core/src/core/override/Override.ts`)

Lets users replace default behavior for 3 browser events:

```typescript
editor.override.paste = (evt: ClipboardEvent) => {
  // Custom paste logic
  // Return { preventDefault: true } to stop default behavior
}

editor.override.copy = () => { ... }

editor.override.drop = (evt: DragEvent) => { ... }
```

All 3 are `undefined` by default — editor uses built-in behavior unless assigned.

**Use case:** Sanitizing pasted HTML, custom drag-drop file handling, etc.

---

## version (`core/src/version.ts`)

```typescript
export const version = '0.3.3'
```

Must stay in sync with `core/package.json`. Always run `yarn sync-version` after bumping versions — this script now automatically updates `version.ts` alongside docs and README.

Accessible at runtime via `editor.version`.
