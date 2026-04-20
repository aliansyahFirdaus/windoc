# Changelog

All notable changes to this project will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.3.26] — 2026-04-20

### Fixed
- Force footer and page number text to black in DOCX export for better Google Docs compatibility


## [0.3.25] — 2026-04-17

### Added
- Add semantic PDF export support

### Changed
- Add a single export dropdown in the toolbar for PDF and DOCX

### Fixed
- Preserve trailing line breaks in DOCX export


## [0.3.24] — 2026-04-13

### Fixed
- Preserve history and change flow correctness


### Performance
- Optimize typing in large documents


## [0.3.21] — 2026-04-08

### Fixed
- Stabilize split table pagination


## [0.3.16] — 2026-04-05

### Fixed
- Use outline instead of border on canvas to fix cursor offset

- Use cursor bounds for scroll visibility check and add default maskMargin

- Only arrow button opens dropdown, not the label/text part

- Auto-flip dropdown to left when it overflows viewport right edge

- Improve zone tip styling and fix padding override

- Debounce zone tip to appear on mouse stop instead of following cursor


## [0.3.13] — 2026-03-26

### Fixed
- Fix vertical centering of text in dropdown select buttons


## [0.3.11] — 2026-03-12

### Added
- Add size 7 to FontSizeTool dropdown


### Fixed
- Fix line-height arrow spacing; feat(docs): add changelog page synced from CHANGELOG.md


## [0.3.9] — 2026-03-12

### Fixed
- Prevent dropdown arrow from overlapping icon in UnderlineTool


## [0.3.7] — 2026-03-11

### Fixed
- Fix StrictMode double-init and closeDropdowns memory leak


## [0.3.6] — 2026-03-11

### Fixed
- Revert override.drop that broke drag-and-drop


## [0.3.5] — 2026-03-11

### Fixed
- Add null guards for richtext commands and fix drop override


## [0.3.4] — 2026-03-11

### Fixed
- Change toolbar position from fixed to sticky


## [0.2.11] — 2026-03-10

### Fixed
- Use fontBoundingBoxAscent for row height calculation


## [0.2.10] — 2026-03-10

### Fixed
- Add heading paragraph spacing, fix separator/image cursor

- Correct cursor height and vertical position calculation


## [0.2.9] — 2026-03-10

### Added
- Add onRangeStyleChange prop to avoid listener overwrite


### Fixed
- Use pt as font size unit instead of px


## [0.2.8] — 2026-03-10

### Fixed
- Watermark dialog redesign, system font stack, Google Docs defaults


## [0.2.7] — 2026-03-09

### Fixed
- Use DOM class toggle for dropdowns, compatible with global close handler


## [0.2.5] — 2026-03-09

### Fixed
- Revert portal dropdowns, restore original dropdown behavior


## [0.2.4] — 2026-03-09

### Fixed
- Override menu-item > div styles for portal dropdowns


## [0.2.3] — 2026-03-09

### Fixed
- Toolbar dropdown portal styling with proper CSS context


## [0.2.1] — 2026-03-09

### Fixed
- Use OIDC trusted publishing, remove NPM_TOKEN

- Replace orhun/git-cliff-action with npx git-cliff

- Portal all toolbar dropdowns to escape overflow container


