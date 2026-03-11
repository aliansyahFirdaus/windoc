#!/usr/bin/env node
/**
 * Syncs version numbers across docs and README files from package.json sources.
 * Run: node scripts/sync-version.js
 */

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

const coreVersion = JSON.parse(
  fs.readFileSync(path.join(root, 'core/package.json'), 'utf8')
).version

const reactVersion = JSON.parse(
  fs.readFileSync(path.join(root, 'react/package.json'), 'utf8')
).version

console.log(`core: ${coreVersion}, react: ${reactVersion}`)

// ── Helper ──────────────────────────────────────────────
function replace(filePath, ...replacers) {
  let content = fs.readFileSync(filePath, 'utf8')
  for (const [pattern, replacement] of replacers) {
    content = content.replace(pattern, replacement)
  }
  fs.writeFileSync(filePath, content)
  console.log(`updated: ${path.relative(root, filePath)}`)
}

// ── docs/src/pages/index.tsx ────────────────────────────
replace(
  path.join(root, 'docs/src/pages/index.tsx'),
  // badge: v0.2.0 — Now available on npm
  [
    /v\d+\.\d+\.\d+ — Now available on npm/,
    `v${coreVersion} — Now available on npm`,
  ],
  // @windoc/core version badge in Packages section
  [
    /(<span className=\{styles\.packageVersion\}>)([\d.]+)(<\/span>[\s\S]*?@windoc\/core)/,
    (_, open, _v, rest) => `${open}${coreVersion}${rest}`,
  ],
  // @windoc/react version badge in Packages section
  [
    /(<span className=\{styles\.packageVersion\}>)([\d.]+)(<\/span>[\s\S]*?@windoc\/react)/,
    (_, open, _v, rest) => `${open}${reactVersion}${rest}`,
  ]
)

// ── README.md ───────────────────────────────────────────
replace(
  path.join(root, 'README.md'),
  [
    /(\| \[@windoc\/core\].*\| )[\d.]+( \|)/,
    `$1${coreVersion}$2`,
  ],
  [
    /(\| \[@windoc\/react\].*\| )[\d.]+( \|)/,
    `$1${reactVersion}$2`,
  ]
)

// ── docs/src/components/StackBlitzEmbed.tsx ─────────────
replace(
  path.join(root, 'docs/src/components/StackBlitzEmbed.tsx'),
  [
    /'@windoc\/core': '[\d.]+'/,
    `'@windoc/core': '${coreVersion}'`,
  ],
  [
    /'@windoc\/react': '[\d.]+'/,
    `'@windoc/react': '${reactVersion}'`,
  ]
)

// ── core/src/version.ts ──────────────────────────────
replace(
  path.join(root, 'core/src/version.ts'),
  [
    /export const version = '[\d.]+'/,
    `export const version = '${coreVersion}'`,
  ]
)

console.log('done.')
