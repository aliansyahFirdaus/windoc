# Repository Guidelines

## Project Structure & Module Organization
This repository is a small Yarn monorepo centered on two publishable packages:

- `core/`: framework-agnostic editor engine in `core/src`, built to `core/dist`
- `react/`: React bindings and UI tools in `react/src`, built to `react/dist`
- `playground/`: local Vite app for manual verification in `playground/src`
- `docs/`: Docusaurus site with docs content in `docs/docs`, site code in `docs/src`, and static assets in `docs/static`
- `scripts/`: release and version-sync utilities used from the repo root

Keep engine logic in `core`; React-specific state, components, and styling belong in `react`.

## Build, Test, and Development Commands
- `yarn install`: install workspace dependencies with Yarn 4
- `yarn build`: build `@windoc/core` and `@windoc/react` with `tsup`
- `yarn dev`: watch both packages during local development
- `cd playground && yarn dev`: run the local playground against the workspace packages
- `cd docs && npm run start`: run the documentation site locally
- `cd docs && npm run build`: build the docs site
- `yarn format`: run Prettier on `core/src` and `react/src`

CI currently validates package builds on Node 20.

## Release Notes
- Use `yarn`, not `npm`, from the repo root. `docs/` is the only npm-based app.
- Package release flow:
  `core/package.json` and `react/package.json` versions must be bumped together, and `react` must update its `@windoc/core` dependency to the same version.
  Run `yarn install`, then `yarn sync-version`, then `yarn changelog`, then `yarn build`.
  Commit the release, push to `main`, then create and push tag `vX.Y.Z`.
  Pushing tag `v*` triggers `.github/workflows/publish.yml` to publish `@windoc/core` and `@windoc/react` to npm.
- Docs deploy flow:
  pushing to `main` triggers `.github/workflows/deploy-docs.yml` to build `docs/` and deploy to GitHub Pages.

## Coding Style & Naming Conventions
Use TypeScript with 2-space indentation, semicolons, single quotes, no trailing commas, and an 80-character print width, as defined in `.prettierrc`. Prefer PascalCase for React component files such as `EditorToolbar.tsx`, camelCase for utilities such as `useDropdown.ts`, and descriptive Conventional Commit scopes like `core`, `react`, or `docs`.

## Testing Guidelines
There is no dedicated automated test suite yet. Validate changes by:

- running `yarn build` before opening a PR
- exercising UI and interaction changes in `playground/`
- checking docs-related changes with `cd docs && npm run build` or `npm run start`

Document manual test coverage in the PR, especially for rendering, selection, toolbar, and pagination behavior.

## Commit & Pull Request Guidelines
Commits are enforced by Husky and Commitlint. Use Conventional Commits, keep the subject under 72 characters, and write in present tense, for example `fix(react): close dropdown on outside click`.

PRs should include a short description of what changed, why it changed, and how it was tested. Link related issues when applicable, update docs for user-facing changes, and include screenshots or recordings for visible UI changes.
