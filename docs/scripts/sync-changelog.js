const fs = require('fs');
const path = require('path');

const source = path.resolve(__dirname, '../../CHANGELOG.md');
const dest = path.resolve(__dirname, '../docs/changelog.md');

const raw = fs.readFileSync(source, 'utf8');

// Strip the top-level H1 and replace with Docusaurus frontmatter
const body = raw.replace(/^# .+\n(\n)?/, '');
const output = `---
title: Changelog
slug: /changelog
---

${body}`;

fs.writeFileSync(dest, output);
console.log('changelog.md synced to docs/docs/');
