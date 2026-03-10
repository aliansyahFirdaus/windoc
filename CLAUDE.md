# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## General Rules
- Always use `yarn`, not `npm` (except in `docs/` which uses npm)
- Do not run dev environment after completing a task
- Never commit `core/dist/` or `react/dist/` — already in `.gitignore`
- Never use `any` type in TypeScript — use proper types or generics

## Project Structure
- `core/` — `@windoc/core`, canvas-based document editor engine (framework-agnostic), built with tsup
- `react/` — `@windoc/react`, React bindings for the core engine, built with tsup
- `docs/` — Docusaurus site, deployed to GitHub Pages on push to `main`
- `scripts/` — utility scripts (e.g., `sync-version.js`)

## Common Commands
```bash
yarn install          # install all workspace dependencies
yarn build            # build both core and react (runs tsup in each package)
yarn sync-version     # sync version numbers to docs and README (required before release)
yarn changelog        # generate CHANGELOG.md from commit history via git-cliff
```

## Architecture

### @windoc/core
The core is a canvas-based document editor. Entry point: `core/src/index.ts`, which exports the `Editor` class and all enums/interfaces.

Key subsystems inside `core/src/core/`:
- **`draw/Draw.ts`** — Central renderer. Manages the canvas draw loop, page layout, element measurement, and coordinates all particle renderers. This is the largest and most critical class.
- **`command/Command.ts` + `CommandAdapt.ts`** — Public API surface for triggering editor actions (e.g., `executeBold`, `executeInsertElementList`). All mutations go through `Command`.
- **`listener/Listener.ts`** — Callback hooks for consumers (e.g., `rangeStyleChange`, `contentChange`, `pageSizeChange`). Assigned directly on the listener object.
- **`register/Register.ts`** — Lets consumers register custom shortcuts (`register.shortcutList`) and context menus (`register.contextMenuList`).
- **`event/CanvasEvent.ts` + `GlobalEvent.ts`** — Wires DOM events (mouse, keyboard, drag, paste, copy, cut) to editor behavior.
- **`history/HistoryManager.ts`** — Undo/redo stack.
- **`range/RangeManager.ts`** — Manages selection/cursor range state.
- **`position/Position.ts`** — Maps canvas coordinates to element positions.
- **`draw/particle/`** — Individual element renderers: `TextParticle`, `TableParticle`, `ImageParticle`, `LaTexParticle`, `CheckboxParticle`, `ListParticle`, etc.
- **`draw/frame/`** — Page frame renderers: `Header`, `Footer`, `PageNumber`, `Watermark`, `Background`, `Margin`.
- **`worker/WorkerManager.ts`** — Off-thread tasks: word count, catalog, value serialization.
- **`event/eventbus/EventBus.ts`** — Internal typed event bus (typed via `EventBusMap` interface).
- **`override/Override.ts`** — Lets consumers override internal behaviors.
- **`plugin/Plugin.ts`** — Plugin system (`editor.use(plugin)`).

Document data model (`IEditorData`): `{ header?: IElement[], main: IElement[], footer?: IElement[], graffiti?: IGraffitiData[] }`. Each `IElement` has a `type` field (`ElementType` enum) and type-specific properties.

### @windoc/react
React wrapper around `@windoc/core`. The core is loaded asynchronously (dynamic import) to avoid SSR issues.

Key files:
- **`Editor.tsx`** — Main component. Mounts `@windoc/core` into a `div`, sets up listeners, registers shortcuts and context menus. Accepts `defaultValue`, `options`, `onChange`, `onReady`, `toolbar`, `footer`, `renderToolbar`, `renderFooter`, `children`.
- **`EditorContext.tsx`** — `EditorProvider` context providing `editorRef`, `rangeStyle`, and `isApple`. Access via `useEditor()` hook.
- **`FooterContext.tsx`** — `FooterProvider` context for footer status (page number, word count, scale). Access via `useFooter()` hook.
- **`EditorToolbar.tsx`** — Pre-built toolbar. Individual tools in `toolbar/`.
- **`EditorFooter.tsx`** — Pre-built footer/status bar. Individual tools in `footer/`.
- **`toolbar/*.tsx`** — Each toolbar button is a standalone exported component (e.g., `BoldTool`, `TableTool`). Each tool calls `useEditor()` to get `editorRef` and invokes `editorRef.current?.command.executeXxx()`.
- **`footer/*.tsx`** — Each footer widget is a standalone exported component that calls `useFooter()` for state.
- **`utils/DropdownPortal.tsx`** — Utility for rendering dropdown menus via React portals.

Both `EditorToolbar` and `EditorFooter`, plus all individual tools, are exported from `react/src/index.ts` to allow consumers to compose custom UIs.

## Commit Convention

Format: `<type>(<scope>): <short description>`

Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `perf`, `test`, `style`, `ci`, `revert`

Scopes (optional): `core`, `react`, `docs`

Rules: present tense, subject max 72 chars. Non-conventional commits are rejected by husky + commitlint.

---

## Release SOP

### 1. Ensure all changes are merged to `main`
```bash
git checkout main && git pull origin main && git status
```

### 2. Bump versions
Edit both files, change version (e.g., `0.2.0` → `0.3.0`):
- `core/package.json` → `"version"`
- `react/package.json` → `"version"` AND `"dependencies"."@windoc/core"`

### 3. Update lockfile
```bash
yarn install
```
This MUST be done after bumping versions to keep `yarn.lock` in sync. CI uses `--immutable` and will fail if lockfile is stale.

### 4. Sync versions to docs and README
```bash
yarn sync-version
```
Updates: version badge in `docs/src/pages/index.tsx` and version table in `README.md`.

### 5. Generate CHANGELOG
```bash
yarn changelog
```
Uses `git-cliff` + `cliff.toml`. Skips: `chore`, `ci`, `test`, `style`. Includes: `feat` → Added, `fix` → Fixed, `refactor` → Changed, `perf` → Performance, `docs` → Documentation.

### 6. Build to verify
```bash
yarn build
```

### 7. Commit all changes
```bash
git add core/package.json react/package.json docs/src/pages/index.tsx README.md CHANGELOG.md yarn.lock
git commit -m "chore: release v0.x.0"
git push origin main
```

### 8. Create git tag — this triggers npm publish
```bash
git tag v0.x.0
git push origin v0.x.0
```
Tag push triggers `.github/workflows/publish.yml` → builds and publishes both packages using `NPM_TOKEN` secret.

### 9. Verify publish
- GitHub Actions tab → "Publish to npm" must be green
- Check npmjs.com for `@windoc/core` and `@windoc/react`

### 10. Create GitHub Release (optional)
```bash
gh release create v0.x.0 --title "v0.x.0" --notes "..."
```

---

## Release Checklist

- [ ] All PRs merged to `main`
- [ ] `core/package.json` version bumped
- [ ] `react/package.json` version bumped (including `@windoc/core` dependency)
- [ ] `yarn sync-version` done
- [ ] `CHANGELOG.md` updated
- [ ] `yarn build` succeeds with no TypeScript errors
- [ ] Commit `chore: release vX.X.X`
- [ ] Tag `vX.X.X` created and pushed
- [ ] GitHub Actions "Publish to npm" green
- [ ] npm packages verified online
