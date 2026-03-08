# Contributing to Windoc

First off — thank you for taking the time to contribute. Windoc is a small but growing open source project, and every contribution matters, whether it's a bug fix, a new feature, improved docs, or just opening a well-written issue.

This guide covers everything you need to know to contribute effectively.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Branches & Commits](#branches--commits)
- [Pull Requests](#pull-requests)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Code Style](#code-style)
- [Release Process](#release-process)

---

## Code of Conduct

Be respectful. Be constructive. Assume good intent. We're all here because we care about building something good.

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Yarn (this project uses Yarn workspaces — **do not use npm**)

### Setup

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/windoc.git
cd windoc

# 2. Add the upstream remote
git remote add upstream https://github.com/aliansyahFirdaus/windoc.git

# 3. Install dependencies
yarn install

# 4. Build both packages
yarn build
```

### Running in watch mode

```bash
# Watch both packages simultaneously
yarn dev
```

This runs `tsup --watch` on both `@windoc/core` and `@windoc/react` in parallel. Any change you make to the source is immediately compiled to `dist/`.

### Running the docs site locally

```bash
cd docs
npm install
npm run start
```

---

## Project Structure

```
windoc/
├── core/               # @windoc/core — canvas editor engine (framework-agnostic)
│   ├── src/
│   │   ├── core/       # Rendering, draw pipeline, particles, cursor, history
│   │   ├── dataset/    # Constants, default options
│   │   ├── interface/  # TypeScript interfaces
│   │   ├── utils/      # Shared utilities
│   │   └── index.ts    # Public API entry point
│   └── tsup.config.ts
│
├── react/              # @windoc/react — React bindings & composable UI
│   ├── src/
│   │   ├── toolbar/    # Individual toolbar tool components
│   │   ├── footer/     # Individual footer tool components
│   │   ├── hooks/      # useEditor, useFooter
│   │   ├── context/    # EditorProvider, EditorContext
│   │   └── index.ts
│   └── tsup.config.ts
│
├── docs/               # Docusaurus documentation site
│   ├── docs/           # Markdown content
│   └── src/            # Landing page, components, CSS
│
└── package.json        # Yarn workspace root
```

**Rule of thumb:** core is the engine, react is the UI layer. Keep them decoupled. If something works without React, it belongs in core.

---

## Development Workflow

### 1. Sync with upstream before starting

```bash
git checkout main
git pull upstream main
git push origin main  # keep your fork in sync
```

### 2. Create a feature branch

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/issue-description
```

### 3. Make your changes

- Work in `core/src/` or `react/src/`
- `yarn dev` to watch and compile
- Test your changes manually (see below)

### 4. Build and verify

```bash
yarn build
```

Make sure the build passes with no TypeScript errors before opening a PR.

### 5. Test manually

There's no automated test suite yet (contributions welcome!). For now:

- If you changed `@windoc/core`: test via the docs live demo or a local React app using `yarn link` or `file:` reference
- If you changed `@windoc/react`: test by running the docs site locally (`cd docs && npm run start`)
- Check both light and dark mode
- Check both desktop and mobile viewport

---

## Branches & Commits

### Branch naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<description>` | `feat/table-merge-undo` |
| Bug fix | `fix/<description>` | `fix/cursor-jump-on-paste` |
| Docs | `docs/<description>` | `docs/add-commands-reference` |
| Refactor | `refactor/<description>` | `refactor/draw-pipeline` |
| Chore | `chore/<description>` | `chore/update-tsup` |

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `chore`, `perf`, `test`

**Scopes:** `core`, `react`, `docs`, or omit if cross-cutting

**Examples:**

```
feat(core): add support for column layout elements
fix(react): toolbar dropdown closes on outside click
docs: add keyboard shortcuts guide
chore: upgrade tsup to v9
```

**Rules:**
- Use present tense: "add feature", not "added feature"
- Keep the subject line under 72 characters
- Reference issues in the footer: `Closes #42`

---

## Pull Requests

### Before opening a PR

- [ ] Branch is up to date with `upstream/main`
- [ ] `yarn build` passes with no errors
- [ ] Changes are manually tested
- [ ] New behavior is documented (inline or in `docs/`)
- [ ] Commit history is clean (squash fixup commits if needed)

### PR title

Same format as commit messages: `feat(core): add X` or `fix(react): Y`.

### PR description template

When you open a PR, fill in:

```
## What
Brief description of the change.

## Why
Why this change is needed. Link to the issue if applicable.

## How
High-level explanation of the approach taken.

## Testing
What you tested and how.
```

### Review process

- PRs are reviewed by maintainers within a few days
- Expect feedback — iteration is normal and healthy
- One approving review is required before merge
- PRs are merged with **squash and merge** to keep the main branch history clean

---

## Reporting Bugs

Before opening an issue, search existing issues to avoid duplicates.

A good bug report includes:

1. **Windoc version** (`@windoc/core` and `@windoc/react`)
2. **Browser and OS**
3. **Minimal reproduction** — a code snippet or CodeSandbox that isolates the bug
4. **Expected behavior** vs **actual behavior**
5. **Console errors** if any

```md
### Bug report

**Version:** @windoc/core@0.2.0, @windoc/react@0.2.0
**Browser:** Chrome 122 / macOS

**Reproduction:**
<code or steps>

**Expected:** ...
**Actual:** ...
```

---

## Suggesting Features

Open an issue with the `enhancement` label. Include:

- **Use case** — what problem does this solve?
- **Proposed API** — how would a developer use this feature?
- **Alternatives considered** — what other approaches did you think about?

Features that align with the canvas-first, pagination-accurate philosophy of Windoc are most likely to be accepted.

---

## Code Style

The project uses TypeScript strict mode. A few conventions to follow:

**Naming**
- Classes: `PascalCase`
- Methods and variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Private class members: prefix with `_` (e.g., `_createDom()`)

**Structure**
- One class per file in `core/src/core/`
- Keep files focused — if a file is growing beyond ~400 lines, consider splitting
- Interfaces go in `core/src/interface/`, not inline

**React (react package)**
- Functional components only
- Hooks start with `use`
- Keep components small — if a component is doing too much, extract logic to a hook

**No linter is configured yet** — contributions to add ESLint + Prettier are welcome.

---

## Release Process

Releases are handled by the maintainer. The general flow:

1. Changes land on `main` via merged PRs
2. Maintainer bumps versions in `core/package.json` and `react/package.json`
3. Changelog is updated
4. Published to npm: `npm publish --access public` from each package directory
5. Git tag is created: `git tag v0.x.0`
6. Docs deploy automatically via GitHub Actions on push to `main`

---

## Questions?

Open a [GitHub Discussion](https://github.com/aliansyahFirdaus/windoc/discussions) or file an issue with the `question` label.

---

*Thank you for contributing to Windoc.*
