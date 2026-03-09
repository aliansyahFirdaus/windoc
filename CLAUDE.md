# Windoc — Instructions for Claude Code

## General Rules
- Selalu pakai `yarn`, bukan `npm` (kecuali di folder `docs/` yang pakai npm)
- Jangan jalankan dev environment setelah selesai tugas
- Jangan commit `core/dist/` atau `react/dist/` — sudah ada di `.gitignore`

## Project Structure
- `core/` — `@windoc/core`, canvas editor engine (framework-agnostic)
- `react/` — `@windoc/react`, React bindings
- `docs/` — Docusaurus site, deploy ke GitHub Pages via `main` branch push
- `scripts/` — utility scripts

## Common Commands
```bash
yarn install          # install all workspace dependencies
yarn build            # build both core dan react
yarn sync-version     # sync version numbers ke docs dan README (WAJIB sebelum release)
```

---

## Release SOP — Wajib Diikuti Saat Publish ke npm

### 1. Pastikan semua changes sudah di-merge ke `main`
```bash
git checkout main
git pull origin main
git status  # harus clean
```

### 2. Bump versi di kedua package
Edit kedua file ini, ganti versi ke versi baru (misal `0.2.0` → `0.3.0`):
- `core/package.json` → field `"version"`
- `react/package.json` → field `"version"` DAN `"dependencies"."@windoc/core"`

### 3. Sync versi ke docs dan README
```bash
yarn sync-version
```
Ini update otomatis:
- Badge versi di `docs/src/pages/index.tsx`
- Tabel versi di `README.md`

### 4. Update CHANGELOG.md
Tambahkan section baru di atas dengan format:
```md
## [0.x.0] — YYYY-MM-DD

### Added
- ...

### Fixed
- ...

### Changed
- ...
```

### 5. Build untuk verifikasi
```bash
yarn build
```
Pastikan tidak ada TypeScript error.

### 6. Commit semua changes
```bash
git add core/package.json react/package.json docs/src/pages/index.tsx README.md CHANGELOG.md
git commit -m "chore: release v0.x.0"
git push origin main
```

### 7. Buat git tag — INI YANG TRIGGER PUBLISH KE NPM
```bash
git tag v0.x.0
git push origin v0.x.0
```

Tag push akan trigger `.github/workflows/publish.yml` secara otomatis.
Workflow akan build kedua packages dan publish ke npm menggunakan `NPM_TOKEN` secret.

### 8. Verifikasi publish berhasil
- Cek GitHub Actions tab — workflow "Publish to npm" harus hijau
- Cek `https://www.npmjs.com/package/@windoc/core`
- Cek `https://www.npmjs.com/package/@windoc/react`

### 9. Buat GitHub Release (opsional tapi bagus)
```bash
gh release create v0.x.0 --title "v0.x.0" --notes "$(cat <<'EOF'
## What's new

Copy relevant section dari CHANGELOG.md ke sini.
EOF
)"
```

---

## Checklist Release (copy-paste ini saat mau release)

- [ ] Semua PRs sudah merged ke `main`
- [ ] `core/package.json` versi di-bump
- [ ] `react/package.json` versi di-bump (termasuk dependency `@windoc/core`)
- [ ] `yarn sync-version` sudah dijalankan
- [ ] `CHANGELOG.md` sudah diupdate
- [ ] `yarn build` berhasil tanpa error
- [ ] Commit dengan message `chore: release vX.X.X`
- [ ] Tag `vX.X.X` dibuat dan di-push
- [ ] GitHub Actions "Publish to npm" berhasil (hijau)
- [ ] npm package terverifikasi online

---

## Setup NPM_TOKEN (hanya perlu dilakukan sekali)

Sebelum workflow publish bisa berjalan, perlu setup secret di GitHub:
1. Login ke `npmjs.com` → Account → Access Tokens → Generate New Token → "Automation"
2. Copy token
3. Buka GitHub repo → Settings → Secrets and variables → Actions → New repository secret
4. Name: `NPM_TOKEN`, Value: token yang di-copy
