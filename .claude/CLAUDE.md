## Commit Convention

This project enforces [Conventional Commits](https://www.conventionalcommits.org/) via commitlint + husky.

**Format:** `<type>(<scope>): <short description>`

**Types:** `feat`, `fix`, `docs`, `refactor`, `chore`, `perf`, `test`, `style`, `ci`, `revert`

**Scopes (optional):** `core`, `react`, `docs`

**Examples:**
- `feat(core): add column layout support`
- `fix(react): dropdown closes on outside click`
- `docs: update getting started guide`
- `chore: bump tsup to v9`

**Rules:**
- Present tense ("add", not "added")
- Subject line max 72 characters
- Non-conventional commits are rejected by git hook

## Release

- Bump versions in `core/package.json` and `react/package.json`
- Push a git tag `v0.x.x` to trigger CI publish
- CI auto-publishes to npm, updates CHANGELOG.md, creates GitHub Release

## General

- Use yarn, not npm
- Do not run dev server after completing tasks
